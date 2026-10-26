"""POST /lists/{listId}/items"""

from db.items.create_item import create_item
from helpers.access import list_not_found, require_member
from helpers.clock import now_iso
from helpers.constants import CREATE_ITEM_FIELDS
from helpers.ids import new_id
from helpers.request import Request
from helpers.responses import created
from helpers.views import item_view


def createitem(req: Request) -> dict:
    list_id = req.path("listId")
    body = req.body(CREATE_ITEM_FIELDS)
    require_member(list_id, req.user.sub)
    item = create_item(list_id, new_id(), body, req.user.sub, now_iso())
    if item is None:
        raise list_not_found()
    return created({"item": item_view(item)})
