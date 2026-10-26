"""One ITEM row, or None."""

from db import keys
from db.table import table


def get_item(list_id: str, item_id: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.list_pk(list_id), keys.item_sk(item_id)))
    return resp.get("Item")
