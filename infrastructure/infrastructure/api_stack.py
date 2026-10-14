from pathlib import Path
from typing import Mapping

from aws_cdk import (
    CfnOutput,
    Duration,
    Stack,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_cognito as cognito,
    aws_lambda as lambda_,
    aws_logs as logs,
)
from constructs import Construct

BACKEND_ROOT = Path(__file__).resolve().parents[2] / "backend"


class ApiStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        table: dynamodb.Table,
        user_pool: cognito.UserPool,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        common_env: Mapping[str, str] = {
            "TABLE_NAME": table.table_name,
            "USER_POOL_ID": user_pool.user_pool_id,
            "REGION": self.region,
        }

        self.api = apigateway.RestApi(
            self,
            "ShopTogetherApi",
            rest_api_name="ShopTogether API",
            description="REST API for ShopTogether",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                metrics_enabled=True,
                tracing_enabled=True,
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"],
            ),
        )

        authorizer = apigateway.CognitoUserPoolsAuthorizer(
            self,
            "CognitoAuthorizer",
            cognito_user_pools=[user_pool],
        )
        auth_options = {
            "authorizer": authorizer,
            "authorization_type": apigateway.AuthorizationType.COGNITO,
        }

        create_list = self._function("CreateList", "rest_api/lists/create", common_env)
        get_lists = self._function("GetLists", "rest_api/lists/get_all", common_env)
        get_list = self._function("GetList", "rest_api/lists/get_one", common_env)
        update_list = self._function("UpdateList", "rest_api/lists/update", common_env)
        delete_list = self._function("DeleteList", "rest_api/lists/delete", common_env)

        create_item = self._function("CreateItem", "rest_api/items/create", common_env)
        update_item = self._function("UpdateItem", "rest_api/items/update", common_env)
        toggle_item = self._function("ToggleItem", "rest_api/items/toggle", common_env)
        delete_item = self._function("DeleteItem", "rest_api/items/delete", common_env)

        share_list = self._function("ShareList", "rest_api/share/create", common_env)
        accept_share = self._function("AcceptShare", "rest_api/share/accept", common_env)
        get_collaborators = self._function(
            "GetCollaborators", "rest_api/share/collaborators", common_env
        )
        remove_collaborator = self._function(
            "RemoveCollaborator", "rest_api/share/remove", common_env
        )

        lists = self.api.root.add_resource("lists")
        lists.add_method("POST", apigateway.LambdaIntegration(create_list), **auth_options)
        lists.add_method("GET", apigateway.LambdaIntegration(get_lists), **auth_options)

        list_id = lists.add_resource("{listId}")
        list_id.add_method("GET", apigateway.LambdaIntegration(get_list), **auth_options)
        list_id.add_method("PUT", apigateway.LambdaIntegration(update_list), **auth_options)
        list_id.add_method("DELETE", apigateway.LambdaIntegration(delete_list), **auth_options)

        items = list_id.add_resource("items")
        items.add_method("POST", apigateway.LambdaIntegration(create_item), **auth_options)

        item_id = items.add_resource("{itemId}")
        item_id.add_method("PUT", apigateway.LambdaIntegration(update_item), **auth_options)
        item_id.add_method("PATCH", apigateway.LambdaIntegration(toggle_item), **auth_options)
        item_id.add_method("DELETE", apigateway.LambdaIntegration(delete_item), **auth_options)

        share = list_id.add_resource("share")
        share.add_method("POST", apigateway.LambdaIntegration(share_list), **auth_options)

        collaborators = list_id.add_resource("collaborators")
        collaborators.add_method(
            "GET", apigateway.LambdaIntegration(get_collaborators), **auth_options
        )
        collaborator = collaborators.add_resource("{userId}")
        collaborator.add_method(
            "DELETE", apigateway.LambdaIntegration(remove_collaborator), **auth_options
        )

        share_root = self.api.root.add_resource("share")
        accept = share_root.add_resource("accept")
        accept.add_method("POST", apigateway.LambdaIntegration(accept_share))

        table.grant_read_write_data(create_list)
        table.grant_read_write_data(get_lists)
        table.grant_read_write_data(get_list)
        table.grant_read_write_data(update_list)
        table.grant_read_write_data(delete_list)
        table.grant_read_write_data(create_item)
        table.grant_read_write_data(update_item)
        table.grant_read_write_data(toggle_item)
        table.grant_read_write_data(delete_item)
        table.grant_read_write_data(share_list)
        table.grant_read_write_data(accept_share)
        table.grant_read_write_data(get_collaborators)
        table.grant_read_write_data(remove_collaborator)

        CfnOutput(self, "ApiUrl", value=self.api.url, export_name="ShopTogetherApiUrl")

    def _function(
        self, name: str, asset_path: str, environment: Mapping[str, str]
    ) -> lambda_.Function:
        return lambda_.Function(
            self,
            f"{name}Function",
            function_name=f"ShopTogether-{name}",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="handler.handler",
            code=lambda_.Code.from_asset(str(BACKEND_ROOT / asset_path)),
            environment=dict(environment),
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE,
        )
