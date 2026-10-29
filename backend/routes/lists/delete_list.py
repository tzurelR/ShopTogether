"""DELETE /lists/{listId}"""

from db import keys
from db.lists.delete_list import delete_list
from helpers.access import require_owner
from helpers.broadcast import broadcast
from helpers.notify import notify
from helpers.request import Request
from helpers.responses import no_content
from helpers.views import list_view


def deletelist(req: Request) -> dict:
    list_id = req.path("listId")
    owner = require_owner(list_id, req.user.sub)
    rows = delete_list(list_id)
    meta = next((row for row in rows if row["SK"] == keys.META), None)
    # The CONN# rows are already deleted, so pass the ones read during the delete.
    connections = [row for row in rows if row["SK"].startswith(keys.CONN_PREFIX)]
    if meta is not None:
        message = {"type": "list.deleted", "listId": list_id, "by": req.user.sub, "list": list_view(meta)}
        broadcast(list_id, message, connections=connections)
        # The rows are gone, so hand over the members and name read during the delete.
        members = [row for row in rows if row["SK"].startswith(keys.MEMBER_PREFIX)]
        notify(list_id, "list.deleted", req.user.sub, owner.get("email"),
               list_name=meta["name"], members=members, skip_viewers=False)
    return no_content()
