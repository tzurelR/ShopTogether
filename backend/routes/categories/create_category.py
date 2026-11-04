"""POST /lists/{listId}/categories"""

from db.categories.create_category import create_category
from db.categories.get_categories import get_categories
from helpers.access import list_not_found, require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.constants import CREATE_CATEGORY_FIELDS
from helpers.ids import new_id
from helpers.request import Request
from helpers.responses import created
from helpers.views import category_view


def createcategory(req: Request) -> dict:
    list_id = req.path("listId")
    body = req.body(CREATE_CATEGORY_FIELDS)
    require_member(list_id, req.user.sub)
    position = body.get("position")
    if position is None:
        # New categories go last.
        position = max((float(c.get("position") or 0) for c in get_categories(list_id)), default=0) + 1
    row = create_category(list_id, new_id(), body["name"], position, req.user.sub, now_iso())
    if row is None:
        raise list_not_found()
    view = category_view(row)
    broadcast(list_id, {"type": "category.created", "listId": list_id, "by": req.user.sub, "category": view})
    return created({"category": view})
