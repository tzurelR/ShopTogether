"""PATCH /lists/{listId}/items/{itemId}"""

from db.items.update_item import update_item
from helpers.access import require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.constants import UPDATE_ITEM_FIELDS
from helpers.errors import NotFound
from helpers.request import Request
from helpers.responses import ok
from helpers.views import item_view


def updateitem(req: Request) -> dict:
    list_id = req.path("listId")
    item_id = req.path("itemId")
    changes = req.body(UPDATE_ITEM_FIELDS, require_any=True)
    require_member(list_id, req.user.sub)
    item = update_item(list_id, item_id, changes, req.user.sub, now_iso())
    if item is None:
        raise NotFound("Item not found. Someone may have deleted it.")
    view = item_view(item)
    broadcast(list_id, {"type": "item.updated", "listId": list_id, "by": req.user.sub, "item": view})
    return ok({"item": view})
