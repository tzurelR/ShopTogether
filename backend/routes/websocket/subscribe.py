"""{"action":"subscribe","listId":"L1"}: start receiving changes and presence for a list."""

import time

from db.connections.get_connection import get_connection
from db.connections.get_list_connections import get_list_connections
from db.connections.subscribe_connection import subscribe_connection
from db.connections.unsubscribe_connection import unsubscribe_connection
from db.members.get_member import get_member
from helpers.access import list_not_found
from helpers.constants import CONNECTION_TTL_SECONDS, SUBSCRIBE_FIELDS
from helpers.errors import Unauthorized
from helpers.broadcast import broadcast
from helpers.sockets import send
from helpers.websocket_request import WebsocketRequest


def _present(list_id: str) -> list[dict]:
    return [{"sub": c["sub"], "email": c.get("email"), "connectionId": c["connectionId"]} for c in get_list_connections(list_id)]


def subscribe(req: WebsocketRequest) -> dict:
    list_id = req.body(SUBSCRIBE_FIELDS)["listId"]
    conn = get_connection(req.connection_id)
    if conn is None:
        raise Unauthorized("Connection expired. Reconnect.")
    if get_member(list_id, conn["sub"]) is None:
        raise list_not_found()

    # One open list per socket: leave the previous one first.
    previous = conn.get("listId")
    if previous and previous != list_id:
        unsubscribe_connection(req.connection_id, previous)
        broadcast(previous, {"type": "presence.left", "listId": previous, "sub": conn["sub"], "connectionId": req.connection_id})

    expires_at = int(time.time()) + CONNECTION_TTL_SECONDS
    if not subscribe_connection(req.connection_id, list_id, conn["sub"], conn.get("email", ""), expires_at):
        raise Unauthorized("Connection expired. Reconnect.")

    joined = {"type": "presence.joined", "listId": list_id, "sub": conn["sub"], "email": conn.get("email"), "connectionId": req.connection_id}
    broadcast(list_id, joined, exclude=req.connection_id)
    send(req.connection_id, {"type": "subscribed", "listId": list_id, "present": _present(list_id)})
    return {"statusCode": 200}
