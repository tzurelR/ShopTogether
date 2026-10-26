"""Change an item's fields and keep META doneCount/updatedAt in step, in one transaction."""

from botocore.exceptions import ClientError

from db import keys
from db.items.get_item import get_item
from db.table import is_condition_failure, transact_write, tx_update
from helpers.constants import ITEM_WRITE_ATTEMPTS
from helpers.errors import Conflict


def update_item(list_id: str, item_id: str, changes: dict, sub: str, now: str) -> dict | None:
    """Returns the updated item, or None if the item (or list) doesn't exist."""
    for _ in range(ITEM_WRITE_ATTEMPTS):
        current = get_item(list_id, item_id)
        if current is None:
            return None

        sets = ["updatedAt = :now", "updatedBy = :sub"]
        removes = []
        names = {"#done": "done"}
        values = {":now": now, ":sub": sub, ":old_done": current.get("done", False)}
        for field, value in changes.items():
            names[f"#{field}"] = field
            if field == "qty" and value == "":
                removes.append("#qty")
            else:
                sets.append(f"#{field} = :{field}")
                values[f":{field}"] = value
        update = "SET " + ", ".join(sets) + (" REMOVE " + ", ".join(removes) if removes else "")

        done_delta = 0
        if "done" in changes and changes["done"] != current.get("done", False):
            done_delta = 1 if changes["done"] else -1

        try:
            transact_write([
                # The item must still exist and still have the done value we based the count on.
                tx_update(
                    keys.key(keys.list_pk(list_id), keys.item_sk(item_id)),
                    update,
                    condition="attribute_exists(PK) AND #done = :old_done",
                    names=names,
                    values=values,
                ),
                tx_update(
                    keys.key(keys.list_pk(list_id), keys.META),
                    "SET updatedAt = :now ADD doneCount :delta",
                    condition="attribute_exists(PK)",
                    values={":now": now, ":delta": done_delta},
                ),
            ])
        except ClientError as err:
            if is_condition_failure(err):
                continue  # deleted or changed meanwhile: re-read and try again
            raise

        updated = {**current, "updatedAt": now, "updatedBy": sub}
        for field, value in changes.items():
            if field == "qty" and value == "":
                updated.pop("qty", None)
            else:
                updated[field] = value
        return updated
    if get_item(list_id, item_id) is None:
        return None
    raise Conflict("Someone else is editing this item. Try again.")
