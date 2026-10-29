"""ST-4 + ST-5: HTTP API (JWT authorizer -> api Lambda) and WebSocket API (-> websocket Lambda)."""

from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_authorizers as authorizers
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from constructs import Construct

from .config import Config
from .lambdas import PUSH_SENDER_DIR, node_function, python_function

# Caps the bill if a client or a bug loops.
THROTTLE = apigw.ThrottleSettings(rate_limit=20, burst_limit=50)

HTTP_ROUTES: list[tuple[apigw.HttpMethod, str]] = [
    (apigw.HttpMethod.GET, "/lists"),
    (apigw.HttpMethod.POST, "/lists"),
    (apigw.HttpMethod.GET, "/lists/{listId}"),
    (apigw.HttpMethod.PATCH, "/lists/{listId}"),
    (apigw.HttpMethod.DELETE, "/lists/{listId}"),
    (apigw.HttpMethod.POST, "/lists/{listId}/items"),
    (apigw.HttpMethod.PATCH, "/lists/{listId}/items/{itemId}"),
    (apigw.HttpMethod.DELETE, "/lists/{listId}/items/{itemId}"),
    (apigw.HttpMethod.POST, "/lists/{listId}/invites"),
    (apigw.HttpMethod.DELETE, "/lists/{listId}/invites/{email}"),
    (apigw.HttpMethod.GET, "/invites/{token}"),
    (apigw.HttpMethod.POST, "/invites/{token}/accept"),
    (apigw.HttpMethod.DELETE, "/lists/{listId}/members/{sub}"),
    (apigw.HttpMethod.POST, "/push/subscriptions"),
    (apigw.HttpMethod.DELETE, "/push/subscriptions/{id}"),
]

WEBSOCKET_ROUTES = ["subscribe", "unsubscribe"]


class ApiStack(Stack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        *,
        config: Config,
        table: dynamodb.ITable,
        user_pool: cognito.IUserPool,
        user_pool_client: cognito.IUserPoolClient,
        **kwargs,
    ) -> None:
        super().__init__(scope, id, **kwargs)

        cognito_env = {
            "USER_POOL_ID": user_pool.user_pool_id,
            "USER_POOL_CLIENT_ID": user_pool_client.user_pool_client_id,
        }

        # ---------- Lambdas ----------
        api_fn = python_function(
            self,
            "ApiFunction",
            config=config,
            handler="api.handler.handler",
            description="ShopTogether REST routes",
            environment={"TABLE_NAME": table.table_name, "APP_URL": config.app_url, **cognito_env},
        )
        websocket_fn = python_function(
            self,
            "WebsocketFunction",
            config=config,
            handler="websocket.handler.handler",
            description="ShopTogether WebSocket connect/disconnect/subscribe",
            environment={"TABLE_NAME": table.table_name, **cognito_env},
        )
        table.grant_read_write_data(api_fn)
        table.grant_read_write_data(websocket_fn)

        if config.sender_email:
            api_fn.add_environment("SENDER_EMAIL", config.sender_email)
            # identity/* because SES sandbox also authorizes against the (verified) recipient.
            api_fn.add_to_role_policy(
                iam.PolicyStatement(
                    actions=["ses:SendEmail"],
                    resources=[f"arn:{self.partition}:ses:{self.region}:{self.account}:identity/*"],
                )
            )

        # ---------- Push notifications (only when a VAPID key is configured) ----------
        if config.vapid_public_key:
            push_fn = node_function(
                self,
                "PushSenderFunction",
                config=config,
                code_dir=PUSH_SENDER_DIR,
                description="ShopTogether Web Push sender",
                environment={
                    "TABLE_NAME": table.table_name,
                    "VAPID_PUBLIC_KEY": config.vapid_public_key,
                    "VAPID_SUBJECT": config.vapid_subject,
                    "VAPID_PRIVATE_KEY_PARAM": config.vapid_private_key_param,
                },
            )
            table.grant_read_write_data(push_fn)  # deletes subscriptions that went stale
            push_fn.add_to_role_policy(
                iam.PolicyStatement(
                    actions=["ssm:GetParameter"],
                    resources=[
                        f"arn:{self.partition}:ssm:{self.region}:{self.account}:parameter{config.vapid_private_key_param}"
                    ],
                )
            )
            push_fn.grant_invoke(api_fn)
            api_fn.add_environment("PUSH_FUNCTION_NAME", push_fn.function_name)

        # ---------- HTTP API ----------
        http_api = apigw.HttpApi(
            self,
            "HttpApi",
            api_name=f"shoptogether-{config.stage}-http",
            create_default_stage=False,
            default_authorizer=authorizers.HttpUserPoolAuthorizer(
                "CognitoAuthorizer",
                user_pool,
                user_pool_clients=[user_pool_client],
            ),
            cors_preflight=apigw.CorsPreflightOptions(
                allow_origins=config.cors_origins,
                allow_methods=[
                    apigw.CorsHttpMethod.GET,
                    apigw.CorsHttpMethod.POST,
                    apigw.CorsHttpMethod.PATCH,
                    apigw.CorsHttpMethod.DELETE,
                    apigw.CorsHttpMethod.OPTIONS,
                ],
                allow_headers=["Authorization", "Content-Type"],
                max_age=Duration.hours(1),
            ),
        )
        http_stage = http_api.add_stage(
            "DefaultStage",
            stage_name="$default",
            auto_deploy=True,
            throttle=THROTTLE,
        )
        api_integration = integrations.HttpLambdaIntegration("ApiIntegration", api_fn)
        for method, path in HTTP_ROUTES:
            http_api.add_routes(path=path, methods=[method], integration=api_integration)

        # ---------- WebSocket API ----------
        websocket_integration = integrations.WebSocketLambdaIntegration("WebsocketIntegration", websocket_fn)
        websocket_api = apigw.WebSocketApi(
            self,
            "WebsocketApi",
            api_name=f"shoptogether-{config.stage}-websocket",
            route_selection_expression="$request.body.action",
            connect_route_options=apigw.WebSocketRouteOptions(integration=websocket_integration),
            disconnect_route_options=apigw.WebSocketRouteOptions(integration=websocket_integration),
            default_route_options=apigw.WebSocketRouteOptions(integration=websocket_integration),
        )
        for route in WEBSOCKET_ROUTES:
            websocket_api.add_route(route, integration=websocket_integration)

        websocket_stage = apigw.WebSocketStage(
            self,
            "WebsocketStage",
            web_socket_api=websocket_api,
            stage_name=config.stage,
            auto_deploy=True,
            throttle=THROTTLE,
        )

        # Both functions push to sockets: api after writes, websocket for presence events.
        for fn in (api_fn, websocket_fn):
            websocket_stage.grant_management_api_access(fn)
            fn.add_environment("WEBSOCKET_CALLBACK_URL", websocket_stage.callback_url)

        CfnOutput(self, "ApiUrl", value=http_stage.url)
        CfnOutput(self, "WebsocketUrl", value=websocket_stage.url)
