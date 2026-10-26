"""Put an ITEM row and bump the list's META counts and updatedAt in one transaction."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, transact_write, tx_put, tx_update


def create_item(list_id: str, item_id: str, fields: dict, sub: str, now: str) -> dict | None:
    """Returns the new item, or None if the list no longer exists."""
    item = {
        **keys.key(keys.list_pk(list_id), keys.item_sk(item_id)),
        "itemId": item_id,
        "text": fields["text"],
        "done": fields.get("done", False),
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": sub,
    }
    if fields.get("qty"):
        item["qty"] = fields["qty"]
    if fields.get("position") is not None:
        item["position"] = fields["position"]

    try:
        transact_write([
            tx_put(item, condition="attribute_not_exists(PK)"),
            tx_update(
                keys.key(keys.list_pk(list_id), keys.META),
                "SET updatedAt = :now ADD itemCount :one, doneCount :done",
                condition="attribute_exists(PK)",
                values={":now": now, ":one": 1, ":done": 1 if item["done"] else 0},
            ),
        ])
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return item
