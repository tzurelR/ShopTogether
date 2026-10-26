"""Every row under LIST#id in one query: META, ITEM#, MEMBER#, INVITE# and CONN#."""

from boto3.dynamodb.conditions import Key

from db import keys
from db.table import query_all


def get_list(list_id: str) -> list[dict]:
    return query_all(KeyConditionExpression=Key("PK").eq(keys.list_pk(list_id)))
