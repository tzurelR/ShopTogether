from pathlib import Path

from aws_cdk import (
    CfnOutput,
    Duration,
    Stack,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_lambda_event_sources as lambda_event_sources,
    aws_logs as logs,
)
from constructs import Construct

BACKEND_ROOT = Path(__file__).resolve().parents[2] / "backend"


class WebSocketStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        table: dynamodb.Table,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        common_env = {
            "TABLE_NAME": table.table_name,
            "REGION": self.region,
        }

        self.web_socket_api = apigwv2.WebSocketApi(
            self,
            "ShopTogetherWebSocket",
            api_name="ShopTogetherWebSocket",
            route_selection_expression="$request.body.action",
        )

        connect_fn = self._function("WSConnect", "websocket/connect", common_env)
        disconnect_fn = self._function("WSDisconnect", "websocket/disconnect", common_env)
        message_fn = self._function("WSMessage", "websocket/message", common_env)
        broadcast_fn = self._function("WSBroadcast", "websocket/broadcast", common_env)

        table.grant_read_write_data(connect_fn)
        table.grant_read_write_data(disconnect_fn)
        table.grant_read_write_data(message_fn)
        table.grant_read_data(broadcast_fn)
        table.grant_stream_read(broadcast_fn)

        broadcast_fn.add_event_source(
            lambda_event_sources.DynamoEventSource(
                table,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=10,
                bisect_batch_on_error=True,
                retry_attempts=3,
            )
        )

        ws_endpoint = (
            f"https://{self.web_socket_api.api_id}.execute-api.{self.region}.amazonaws.com/prod"
        )
        message_fn.add_environment("WEBSOCKET_API_ENDPOINT", ws_endpoint)
        broadcast_fn.add_environment("WEBSOCKET_API_ENDPOINT", ws_endpoint)

        connect_integration = apigwv2_integrations.WebSocketLambdaIntegration(
            "ConnectIntegration", connect_fn
        )
        disconnect_integration = apigwv2_integrations.WebSocketLambdaIntegration(
            "DisconnectIntegration", disconnect_fn
        )
        message_integration = apigwv2_integrations.WebSocketLambdaIntegration(
            "MessageIntegration", message_fn
        )

        apigwv2.WebSocketRoute(
            self,
            "ConnectRoute",
            web_socket_api=self.web_socket_api,
            route_key="$connect",
            integration=connect_integration,
        )
        apigwv2.WebSocketRoute(
            self,
            "DisconnectRoute",
            web_socket_api=self.web_socket_api,
            route_key="$disconnect",
            integration=disconnect_integration,
        )
        apigwv2.WebSocketRoute(
            self,
            "DefaultRoute",
            web_socket_api=self.web_socket_api,
            route_key="$default",
            integration=message_integration,
        )

        self.stage = apigwv2.WebSocketStage(
            self,
            "ProdStage",
            web_socket_api=self.web_socket_api,
            stage_name="prod",
            auto_deploy=True,
        )

        websocket_policy = iam.PolicyStatement(
            actions=["execute-api:ManageConnections"],
            resources=[
                f"arn:aws:execute-api:{self.region}:{self.account}:{self.web_socket_api.api_id}/*"
            ],
        )
        message_fn.add_to_role_policy(websocket_policy)
        broadcast_fn.add_to_role_policy(websocket_policy)

        CfnOutput(
            self,
            "WebSocketUrl",
            value=self.stage.url,
            export_name="ShopTogetherWebSocketUrl",
        )

    def _function(self, name: str, asset_path: str, environment: dict) -> lambda_.Function:
        return lambda_.Function(
            self,
            f"{name}Function",
            function_name=f"ShopTogether-{name}",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="handler.handler",
            code=lambda_.Code.from_asset(str(BACKEND_ROOT / asset_path)),
            environment=environment,
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE,
        )
