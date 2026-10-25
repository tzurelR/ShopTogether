"""Shared Lambda defaults: Python 3.12 on arm64, 256 MB, 10 s, logs kept 2 weeks."""

from pathlib import Path

from aws_cdk import Duration
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from constructs import Construct

from .config import Config

# The whole backend/ folder is one asset, so handlers can import backend/shared.
BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
ASSET_EXCLUDES = [".venv", "**/__pycache__", "**/*.pyc", "tests", ".pytest_cache", "README.md", "requirements*.txt"]


def python_function(
    scope: Construct,
    id: str,
    *,
    config: Config,
    handler: str,
    description: str,
    environment: dict[str, str] | None = None,
) -> lambda_.Function:
    log_group = logs.LogGroup(
        scope,
        f"{id}Logs",
        retention=logs.RetentionDays.TWO_WEEKS,
        removal_policy=config.removal_policy,
    )
    return lambda_.Function(
        scope,
        id,
        description=description,
        runtime=lambda_.Runtime.PYTHON_3_12,
        architecture=lambda_.Architecture.ARM_64,
        memory_size=256,
        timeout=Duration.seconds(10),
        code=lambda_.Code.from_asset(str(BACKEND_DIR), exclude=ASSET_EXCLUDES),
        handler=handler,
        environment={"STAGE": config.stage, **(environment or {})},
        log_group=log_group,
    )
