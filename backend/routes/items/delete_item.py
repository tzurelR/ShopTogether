"""DELETE /lists/{listId}/items/{itemId}"""

from db.items.delete_item import delete_item
from helpers.access import require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.errors import NotFound
from helpers.request import Request
from helpers.responses import no_content
from helpers.views import item_view


def deleteitem(req: Request) -> dict:
    list_id = req.path("listId")
    item_id = req.path("itemId")
    require_member(list_id, req.user.sub)
    item = delete_item(list_id, item_id, now_iso())
    if item is None:
        raise NotFound("Item not found. Someone may have deleted it.")
    broadcast(list_id, {"type": "item.deleted", "listId": list_id, "by": req.user.sub, "item": item_view(item)})
    return no_content()
