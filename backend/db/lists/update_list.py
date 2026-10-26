"""Rename a list. Returns the new META, or None if the list no longer exists."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, table


def update_list(list_id: str, name: str, now: str) -> dict | None:
    try:
        resp = table().update_item(
            Key=keys.key(keys.list_pk(list_id), keys.META),
            UpdateExpression="SET #name = :name, updatedAt = :now",
            ConditionExpression="attribute_exists(PK)",
            ExpressionAttributeNames={"#name": "name"},
            ExpressionAttributeValues={":name": name, ":now": now},
            ReturnValues="ALL_NEW",
        )
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return resp["Attributes"]
