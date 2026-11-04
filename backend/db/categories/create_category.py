"""Put a CAT row under the list."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, transact_write, tx_check, tx_put


def create_category(list_id: str, category_id: str, name: str, position: float, sub: str, now: str) -> dict | None:
    """Returns the new category, or None if the list no longer exists."""
    row = {
        **keys.key(keys.list_pk(list_id), keys.cat_sk(category_id)),
        "categoryId": category_id,
        "name": name,
        "position": position,
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": sub,
    }
    try:
        transact_write([
            tx_check(keys.key(keys.list_pk(list_id), keys.META), "attribute_exists(PK)"),
            tx_put(row, condition="attribute_not_exists(PK)"),
        ])
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return row
