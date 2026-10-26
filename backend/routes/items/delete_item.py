"""DELETE /lists/{listId}/items/{itemId}"""

from db.items.delete_item import delete_item
from helpers.access import require_member
from helpers.clock import now_iso
from helpers.errors import NotFound
from helpers.request import Request
from helpers.responses import no_content


def deleteitem(req: Request) -> dict:
    list_id = req.path("listId")
    item_id = req.path("itemId")
    require_member(list_id, req.user.sub)
    if not delete_item(list_id, item_id, now_iso()):
        raise NotFound("Item not found. Someone may have deleted it.")
    return no_content()
