#!/usr/bin/env python3
import os

import aws_cdk as cdk

from shoptogether.api_stack import ApiStack
from shoptogether.auth_stack import AuthStack
from shoptogether.config import REGION, Config
from shoptogether.data_stack import DataStack
from shoptogether.email_stack import EmailStack
from shoptogether.hosting_stack import HostingStack

app = cdk.App()
config = Config.from_context(app)
env = cdk.Environment(account=os.environ.get("CDK_DEFAULT_ACCOUNT"), region=REGION)

cdk.Tags.of(app).add("project", "shoptogether")
cdk.Tags.of(app).add("stage", config.stage)

auth = AuthStack(app, config.stack_name("Auth"), config=config, env=env)
data = DataStack(app, config.stack_name("Data"), config=config, env=env)
ApiStack(
    app,
    config.stack_name("Api"),
    config=config,
    table=data.table,
    user_pool=auth.user_pool,
    user_pool_client=auth.user_pool_client,
    env=env,
)

# Step 5 stacks: off until enabled in cdk.json (senderEmail / hosting).
if config.sender_email:
    EmailStack(app, config.stack_name("Email"), config=config, env=env)
if config.hosting:
    HostingStack(app, config.stack_name("Hosting"), config=config, env=env)

app.synth()
