"""ST-4 + ST-5: HTTP API (JWT authorizer -> api Lambda) and WebSocket API (-> ws Lambda)."""

from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_authorizers as authorizers
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from constructs import Construct

from .config import Config
from .lambdas import python_function

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
]

WS_ROUTES = ["subscribe", "unsubscribe"]


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
        ws_fn = python_function(
            self,
            "WsFunction",
            config=config,
            handler="ws.handler.handler",
            description="ShopTogether WebSocket connect/disconnect/subscribe",
            environment={"TABLE_NAME": table.table_name, **cognito_env},
        )
        table.grant_read_write_data(api_fn)
        table.grant_read_write_data(ws_fn)

        if config.sender_email:
            api_fn.add_environment("SENDER_EMAIL", config.sender_email)
            # identity/* because SES sandbox also authorizes against the (verified) recipient.
            api_fn.add_to_role_policy(
                iam.PolicyStatement(
                    actions=["ses:SendEmail"],
                    resources=[f"arn:{self.partition}:ses:{self.region}:{self.account}:identity/*"],
                )
            )

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
        ws_integration = integrations.WebSocketLambdaIntegration("WsIntegration", ws_fn)
        ws_api = apigw.WebSocketApi(
            self,
            "WsApi",
            api_name=f"shoptogether-{config.stage}-ws",
            route_selection_expression="$request.body.action",
            connect_route_options=apigw.WebSocketRouteOptions(integration=ws_integration),
            disconnect_route_options=apigw.WebSocketRouteOptions(integration=ws_integration),
            default_route_options=apigw.WebSocketRouteOptions(integration=ws_integration),
        )
        for route in WS_ROUTES:
            ws_api.add_route(route, integration=ws_integration)

        ws_stage = apigw.WebSocketStage(
            self,
            "WsStage",
            web_socket_api=ws_api,
            stage_name=config.stage,
            auto_deploy=True,
            throttle=THROTTLE,
        )

        # Both functions push to sockets: api after writes, ws for presence events.
        for fn in (api_fn, ws_fn):
            ws_stage.grant_management_api_access(fn)
            fn.add_environment("WS_CALLBACK_URL", ws_stage.callback_url)

        CfnOutput(self, "ApiUrl", value=http_stage.url)
        CfnOutput(self, "WsUrl", value=ws_stage.url)
