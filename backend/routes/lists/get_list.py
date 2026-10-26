"""GET /lists/{listId}"""

import time

from db import keys
from db.lists.get_list import get_list
from helpers.access import list_not_found
from helpers.request import Request
from helpers.responses import ok
from helpers.views import invite_view, item_view, list_view, member_view


def _item_order(item: dict):
    # Items with a position first (by position), then the rest by ID (= creation time).
    pos = item["position"]
    return (pos is None, pos if pos is not None else 0, item["id"])


def getlist(req: Request) -> dict:
    meta, items, members, invites = None, [], [], []
    for row in get_list(req.path("listId")):
        sk = row["SK"]
        if sk == keys.META:
            meta = row
        elif sk.startswith(keys.ITEM_PREFIX):
            items.append(item_view(row))
        elif sk.startswith(keys.MEMBER_PREFIX):
            members.append(member_view(row))
        elif sk.startswith(keys.INVITE_PREFIX) and row.get("expiresAt", 0) > time.time():
            invites.append(invite_view(row))

    me = next((m for m in members if m["sub"] == req.user.sub), None)
    if meta is None or me is None:
        raise list_not_found()

    items.sort(key=_item_order)
    members.sort(key=lambda m: (m["role"] != "owner", m["joinedAt"] or ""))
    return ok({
        "list": list_view(meta, me["role"]),
        "items": items,
        "members": members,
        # Only the owner manages invites.
        "invites": invites if me["role"] == "owner" else [],
    })
