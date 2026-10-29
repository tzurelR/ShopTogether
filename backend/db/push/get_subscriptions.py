"""Every push subscription (device) of one user."""

from boto3.dynamodb.conditions import Key

from db import keys
from db.table import query_all


def get_subscriptions(sub: str) -> list[dict]:
    return query_all(
        KeyConditionExpression=Key("PK").eq(keys.user_pk(sub)) & Key("SK").begins_with(keys.PUSH_PREFIX),
    )
