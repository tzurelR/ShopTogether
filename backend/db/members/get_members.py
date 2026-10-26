"""Every MEMBER# row of a list."""

from boto3.dynamodb.conditions import Key

from db import keys
from db.table import query_all


def get_members(list_id: str) -> list[dict]:
    return query_all(
        KeyConditionExpression=Key("PK").eq(keys.list_pk(list_id)) & Key("SK").begins_with(keys.MEMBER_PREFIX),
    )
