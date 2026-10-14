#!/usr/bin/env python3
import os

import aws_cdk as cdk

from infrastructure.auth_stack import AuthStack
from infrastructure.database_stack import DatabaseStack
from infrastructure.api_stack import ApiStack
from infrastructure.websocket_stack import WebSocketStack
from infrastructure.frontend_stack import FrontendStack
from infrastructure.email_stack import EmailStack

app = cdk.App()

environment = app.node.try_get_context("env") or "dev"

env = cdk.Environment(
    account=os.getenv("CDK_DEFAULT_ACCOUNT"),
    region=os.getenv("CDK_DEFAULT_REGION", "eu-central-1"),
)

def stack_id(name: str) -> str:
    return f"ShopTogether-{environment}-{name}"


database_stack = DatabaseStack(app, stack_id("Database"), env=env)
auth_stack = AuthStack(app, stack_id("Auth"), env=env)

api_stack = ApiStack(
    app,
    stack_id("Api"),
    table=database_stack.table,
    user_pool=auth_stack.user_pool,
    env=env,
)
api_stack.add_dependency(database_stack)
api_stack.add_dependency(auth_stack)

websocket_stack = WebSocketStack(
    app,
    stack_id("WebSocket"),
    table=database_stack.table,
    env=env,
)
websocket_stack.add_dependency(database_stack)

frontend_stack = FrontendStack(app, stack_id("Frontend"), env=env)
frontend_stack.add_dependency(api_stack)
frontend_stack.add_dependency(websocket_stack)

EmailStack(app, stack_id("Email"), env=env)

cdk.Tags.of(app).add("Project", "ShopTogether")
cdk.Tags.of(app).add("Environment", environment)

app.synth()
