from aws_cdk import CfnOutput, Stack
from constructs import Construct


class EmailStack(Stack):
    """SES identities and production access are configured in the console for now."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        CfnOutput(
            self,
            "SesNote",
            value="Configure SES sender + production access in eu-central-1 when enabling email invites.",
        )
