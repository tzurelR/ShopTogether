"""DELETE /lists/{listId}/items?scope=all|completed — clear the list, or just the checked items."""

from db.items.delete_items import delete_items
from helpers.access import list_not_found, require_member
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.errors import ValidationError
from helpers.request import Request
from helpers.responses import ok
from helpers.views import item_view


def deleteitems(req: Request) -> dict:
    list_id = req.path("listId")
    scope = req.query("scope", "all")
    if scope not in ("all", "completed"):
        raise ValidationError("'scope' must be 'all' or 'completed'.")
    require_member(list_id, req.user.sub)
    deleted = delete_items(list_id, only_done=scope == "completed", now=now_iso())
    if deleted is None:
        raise list_not_found()
    views = [item_view(row) for row in deleted]
    if views:
        broadcast(list_id, {
            "type": "items.deleted",
            "listId": list_id,
            "by": req.user.sub,
            "scope": scope,
            "itemIds": [v["id"] for v in views],
        })
    # The deleted items come back so the app can offer Undo.
    return ok({"deleted": views})
