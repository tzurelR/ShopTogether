"""Delete many items at once (all, or only the checked ones) and recount the list."""

from boto3.dynamodb.conditions import Key

from db import keys
from db.table import batch_delete, is_condition_failure, query_all, table
from botocore.exceptions import ClientError


def delete_items(list_id: str, only_done: bool, now: str) -> list[dict] | None:
    """Returns the deleted ITEM rows, or None if the list no longer exists."""
    items = query_all(
        KeyConditionExpression=Key("PK").eq(keys.list_pk(list_id)) & Key("SK").begins_with(keys.ITEM_PREFIX),
    )
    doomed = [i for i in items if i.get("done")] if only_done else items
    batch_delete([keys.key(i["PK"], i["SK"]) for i in doomed])

    # Recount from what's left instead of subtracting, so the totals stay exact even if
    # someone added or checked an item at the same moment.
    remaining = query_all(
        KeyConditionExpression=Key("PK").eq(keys.list_pk(list_id)) & Key("SK").begins_with(keys.ITEM_PREFIX),
    )
    try:
        table().update_item(
            Key=keys.key(keys.list_pk(list_id), keys.META),
            UpdateExpression="SET itemCount = :items, doneCount = :done, updatedAt = :now",
            ConditionExpression="attribute_exists(PK)",
            ExpressionAttributeValues={
                ":items": len(remaining),
                ":done": sum(1 for i in remaining if i.get("done")),
                ":now": now,
            },
        )
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return doomed
