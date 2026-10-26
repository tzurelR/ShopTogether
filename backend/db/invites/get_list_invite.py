"""The LIST#id / INVITE#email row (what the share sheet shows), or None."""

from db import keys
from db.table import table


def get_list_invite(list_id: str, email: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.list_pk(list_id), keys.invite_sk(email)))
    return resp.get("Item")
