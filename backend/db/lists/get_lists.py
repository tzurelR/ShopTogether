"""The caller's lists: one query on USER#sub, then a BatchGet of each list's META."""

from boto3.dynamodb.conditions import Key

from db import keys
from db.table import batch_get, query_all


def get_lists(sub: str) -> list[dict]:
    """META rows, each with the caller's `role` added."""
    user_rows = query_all(
        KeyConditionExpression=Key("PK").eq(keys.user_pk(sub)) & Key("SK").begins_with("LIST#"),
    )
    roles = {row["listId"]: row["role"] for row in user_rows}
    metas = batch_get([keys.key(keys.list_pk(list_id), keys.META) for list_id in roles])
    return [{**meta, "role": roles[meta["listId"]]} for meta in metas if meta["listId"] in roles]
