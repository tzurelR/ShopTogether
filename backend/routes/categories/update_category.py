"""PATCH /lists/{listId}/categories/{categoryId}"""

from db.categories.update_category import update_category
from helpers.access import require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.constants import UPDATE_CATEGORY_FIELDS
from helpers.errors import NotFound
from helpers.request import Request
from helpers.responses import ok
from helpers.views import category_view


def updatecategory(req: Request) -> dict:
    list_id = req.path("listId")
    category_id = req.path("categoryId")
    changes = req.body(UPDATE_CATEGORY_FIELDS, require_any=True)
    require_member(list_id, req.user.sub)
    row = update_category(list_id, category_id, changes, req.user.sub, now_iso())
    if row is None:
        raise NotFound("Category not found. Someone may have deleted it.")
    view = category_view(row)
    broadcast(list_id, {"type": "category.updated", "listId": list_id, "by": req.user.sub, "category": view})
    return ok({"category": view})
