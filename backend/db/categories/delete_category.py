"""Delete a category. Its items stay in the list, just without a category."""

from boto3.dynamodb.conditions import Attr, Key

from db import keys
from db.table import query_all, table


def delete_category(list_id: str, category_id: str, now: str) -> list[str]:
    """Returns the IDs of the items that were moved out of the category."""
    items = query_all(
        KeyConditionExpression=Key("PK").eq(keys.list_pk(list_id)) & Key("SK").begins_with(keys.ITEM_PREFIX),
        FilterExpression=Attr("categoryId").eq(category_id),
    )
    for item in items:
        table().update_item(
            Key=keys.key(item["PK"], item["SK"]),
            UpdateExpression="REMOVE categoryId SET updatedAt = :now",
            ConditionExpression="categoryId = :cat",
            ExpressionAttributeValues={":now": now, ":cat": category_id},
        )
    table().delete_item(Key=keys.key(keys.list_pk(list_id), keys.cat_sk(category_id)))
    return [item["itemId"] for item in items]
