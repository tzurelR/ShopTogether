"""The LIST#id / META row, or None."""

from db import keys
from db.table import table


def get_list_meta(list_id: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.list_pk(list_id), keys.META))
    return resp.get("Item")
