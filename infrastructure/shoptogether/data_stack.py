"""ST-3: the single DynamoDB table (PK/SK, on-demand, TTL on expiresAt)."""

from aws_cdk import CfnOutput, Stack
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct

from .config import Config


class DataStack(Stack):
    def __init__(self, scope: Construct, id: str, *, config: Config, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.table = dynamodb.Table(
            self,
            "Table",
            table_name=f"shoptogether-{config.stage}",
            partition_key=dynamodb.Attribute(name="PK", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="SK", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            time_to_live_attribute="expiresAt",
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=not config.is_dev,
            ),
            removal_policy=config.removal_policy,
        )

        CfnOutput(self, "TableName", value=self.table.table_name)
