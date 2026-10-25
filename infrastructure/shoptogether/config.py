"""Stage settings read from CDK context (cdk.json, or `-c key=value` on the command line)."""

from dataclasses import dataclass

from aws_cdk import App, RemovalPolicy

REGION = "eu-central-1"
LOCAL_APP_URL = "http://localhost:5173"


def _flag(value) -> bool:
    # Context from cdk.json is a real bool; from `-c hosting=true` it is a string.
    return value is True or str(value).lower() in ("true", "1", "yes")


@dataclass(frozen=True)
class Config:
    stage: str
    app_url: str
    sender_email: str
    hosting: bool

    @classmethod
    def from_context(cls, app: App) -> "Config":
        return cls(
            stage=app.node.try_get_context("stage") or "dev",
            app_url=(app.node.try_get_context("appUrl") or LOCAL_APP_URL).rstrip("/"),
            sender_email=app.node.try_get_context("senderEmail") or "",
            hosting=_flag(app.node.try_get_context("hosting")),
        )

    @property
    def is_dev(self) -> bool:
        return self.stage == "dev"

    @property
    def removal_policy(self) -> RemovalPolicy:
        # Dev is disposable: `cdk destroy` should leave nothing behind.
        return RemovalPolicy.DESTROY if self.is_dev else RemovalPolicy.RETAIN

    @property
    def cors_origins(self) -> list[str]:
        return sorted({LOCAL_APP_URL, self.app_url})

    def stack_name(self, suffix: str) -> str:
        return f"ShopTogether-{self.stage}-{suffix}"
