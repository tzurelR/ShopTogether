"""One MEMBER row: is this user in this list, and with what role?"""

from db import keys
from db.table import table


def get_member(list_id: str, sub: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.list_pk(list_id), keys.member_sk(sub)))
    return resp.get("Item")
