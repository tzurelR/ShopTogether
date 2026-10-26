"""Delete an ITEM row and lower the list's META counts in one transaction."""

from botocore.exceptions import ClientError

from db import keys
from db.items.get_item import get_item
from db.table import is_condition_failure, transact_write, tx_delete, tx_update
from helpers.constants import ITEM_WRITE_ATTEMPTS
from helpers.errors import Conflict


def delete_item(list_id: str, item_id: str, now: str) -> bool:
    """Returns False if the item doesn't exist."""
    for _ in range(ITEM_WRITE_ATTEMPTS):
        current = get_item(list_id, item_id)
        if current is None:
            return False
        done = current.get("done", False)
        try:
            transact_write([
                tx_delete(
                    keys.key(keys.list_pk(list_id), keys.item_sk(item_id)),
                    condition="attribute_exists(PK) AND #done = :old_done",
                    names={"#done": "done"},
                    values={":old_done": done},
                ),
                tx_update(
                    keys.key(keys.list_pk(list_id), keys.META),
                    "SET updatedAt = :now ADD itemCount :minus_one, doneCount :done",
                    condition="attribute_exists(PK)",
                    values={":now": now, ":minus_one": -1, ":done": -1 if done else 0},
                ),
            ])
        except ClientError as err:
            if is_condition_failure(err):
                continue  # changed or deleted meanwhile: re-read and try again
            raise
        return True
    if get_item(list_id, item_id) is None:
        return False
    raise Conflict("Someone else is editing this item. Try again.")
