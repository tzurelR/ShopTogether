import aws_cdk as cdk
from aws_cdk.assertions import Template

from infrastructure.database_stack import DatabaseStack


def test_dynamodb_table_created():
    app = cdk.App()
    stack = DatabaseStack(app, "TestDatabase")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::DynamoDB::Table", 1)
