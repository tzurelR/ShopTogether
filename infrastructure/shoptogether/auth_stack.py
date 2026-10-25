"""ST-2: Cognito user pool (email + password) and a public app client for the browser."""

from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_cognito as cognito
from constructs import Construct

from .config import Config


class AuthStack(Stack):
    def __init__(self, scope: Construct, id: str, *, config: Config, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.user_pool = cognito.UserPool(
            self,
            "UserPool",
            user_pool_name=f"shoptogether-{config.stage}",
            feature_plan=cognito.FeaturePlan.LITE,
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            sign_in_case_sensitive=False,
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            # Cognito's built-in email (50/day) sends the codes; SES is only for invites.
            user_verification=cognito.UserVerificationConfig(
                email_subject="Your ShopTogether code",
                email_body="Your ShopTogether verification code is {####}",
                email_style=cognito.VerificationEmailStyle.CODE,
            ),
            removal_policy=config.removal_policy,
        )

        self.user_pool_client = self.user_pool.add_client(
            "WebClient",
            user_pool_client_name="web",
            generate_secret=False,
            # REFRESH_TOKEN_AUTH is always enabled; only allow password login on top.
            auth_flows=cognito.AuthFlow(user_password=True),
            prevent_user_existence_errors=True,
            access_token_validity=Duration.hours(1),
            id_token_validity=Duration.hours(1),
            refresh_token_validity=Duration.days(30),
            enable_token_revocation=True,
        )

        CfnOutput(self, "UserPoolId", value=self.user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=self.user_pool_client.user_pool_client_id)
        CfnOutput(self, "Region", value=self.region)
