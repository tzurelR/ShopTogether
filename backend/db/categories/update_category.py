"""Rename or move a category. Returns the updated row, or None if it doesn't exist."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, table


def update_category(list_id: str, category_id: str, changes: dict, sub: str, now: str) -> dict | None:
    names = {"#updatedAt": "updatedAt", "#updatedBy": "updatedBy"}
    values = {":now": now, ":sub": sub}
    sets = ["#updatedAt = :now", "#updatedBy = :sub"]
    for field, value in changes.items():
        names[f"#{field}"] = field
        values[f":{field}"] = value
        sets.append(f"#{field} = :{field}")
    try:
        resp = table().update_item(
            Key=keys.key(keys.list_pk(list_id), keys.cat_sk(category_id)),
            UpdateExpression="SET " + ", ".join(sets),
            ConditionExpression="attribute_exists(PK)",
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
            ReturnValues="ALL_NEW",
        )
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return resp["Attributes"]
