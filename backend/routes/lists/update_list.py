"""PATCH /lists/{listId}"""

from db.lists.update_list import update_list
from helpers.access import list_not_found, require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.request import Request
from helpers.responses import ok
from helpers.views import list_view
from helpers.constants import LIST_FIELDS


def updatelist(req: Request) -> dict:
    list_id = req.path("listId")
    body = req.body(LIST_FIELDS)
    member = require_member(list_id, req.user.sub)
    meta = update_list(list_id, body["name"], now_iso())
    if meta is None:
        raise list_not_found()
    broadcast(list_id, {"type": "list.updated", "listId": list_id, "by": req.user.sub, "list": list_view(meta)})
    return ok({"list": list_view(meta, member["role"])})
