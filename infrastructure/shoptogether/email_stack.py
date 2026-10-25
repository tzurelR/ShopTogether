"""ST-6 (part 1): SES identity for the invite sender. Created only when `senderEmail` is set."""

from aws_cdk import CfnOutput, Stack
from aws_cdk import aws_ses as ses
from constructs import Construct

from .config import Config


class EmailStack(Stack):
    def __init__(self, scope: Construct, id: str, *, config: Config, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # AWS emails a verification link to this address after deploy.
        ses.EmailIdentity(
            self,
            "SenderIdentity",
            identity=ses.Identity.email(config.sender_email),
        )

        CfnOutput(self, "SenderEmail", value=config.sender_email)
