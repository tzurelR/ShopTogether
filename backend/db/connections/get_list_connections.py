"""Every LIST#id / CONN# row: the sockets that have this list open."""

from boto3.dynamodb.conditions import Key

from db import keys
from db.table import query_all


def get_list_connections(list_id: str) -> list[dict]:
    return query_all(
        KeyConditionExpression=Key("PK").eq(keys.list_pk(list_id)) & Key("SK").begins_with(keys.CONN_PREFIX),
    )
