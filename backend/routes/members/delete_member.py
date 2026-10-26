"""DELETE /lists/{listId}/members/{sub}: the owner removes someone, or a member leaves."""

from db.connections.get_list_connections import get_list_connections
from db.connections.unsubscribe_connection import unsubscribe_connection
from db.members.delete_member import delete_member
from db.members.get_member import get_member
from helpers.access import require_member
from helpers.broadcast import broadcast
from helpers.errors import Forbidden, NotFound
from helpers.request import Request
from helpers.responses import no_content
from helpers.views import member_view


def deletemember(req: Request) -> dict:
    list_id = req.path("listId")
    target_sub = req.path("sub")
    caller = require_member(list_id, req.user.sub)

    leaving = target_sub == req.user.sub
    if not leaving and caller.get("role") != "owner":
        raise Forbidden("Only the list owner can remove people.")

    target = caller if leaving else get_member(list_id, target_sub)
    if target is None:
        raise NotFound("That person isn't a member of this list.")
    if target.get("role") == "owner":
        raise Forbidden("The owner can't leave or be removed. Delete the list instead.")

    if not delete_member(list_id, target_sub):
        raise NotFound("That person isn't a member of this list.")

    # Tell everyone, including the removed person's open tabs, then stop their updates.
    connections = get_list_connections(list_id)
    message = {"type": "member.removed", "listId": list_id, "by": req.user.sub, "member": member_view(target)}
    broadcast(list_id, message, connections=connections)
    for conn in connections:
        if conn.get("sub") == target_sub:
            unsubscribe_connection(conn["connectionId"], list_id)
    return no_content()
