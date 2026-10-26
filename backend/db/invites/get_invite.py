"""The INVITE#token / META row (what the email link points to), or None."""

from db import keys
from db.table import table


def get_invite(token: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.invite_pk(token), keys.META))
    return resp.get("Item")
