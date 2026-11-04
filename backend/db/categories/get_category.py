"""One CAT row, or None."""

from db import keys
from db.table import table


def get_category(list_id: str, category_id: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.list_pk(list_id), keys.cat_sk(category_id)))
    return resp.get("Item")
