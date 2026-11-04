"""DELETE /lists/{listId}/categories/{categoryId} — its items move to "no category"."""

from db.categories.delete_category import delete_category
from helpers.access import require_category, require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.request import Request
from helpers.responses import no_content


def deletecategory(req: Request) -> dict:
    list_id = req.path("listId")
    category_id = req.path("categoryId")
    require_member(list_id, req.user.sub)
    require_category(list_id, category_id)
    moved = delete_category(list_id, category_id, now_iso())
    broadcast(list_id, {
        "type": "category.deleted",
        "listId": list_id,
        "by": req.user.sub,
        "category": {"id": category_id},
        "movedItemIds": moved,
    })
    return no_content()
