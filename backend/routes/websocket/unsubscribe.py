"""{"action":"unsubscribe"}: stop receiving changes for the open list."""

from db.connections.get_connection import get_connection
from db.connections.unsubscribe_connection import unsubscribe_connection
from helpers.constants import UNSUBSCRIBE_FIELDS
from helpers.broadcast import broadcast
from helpers.websocket_request import WebsocketRequest


def unsubscribe(req: WebsocketRequest) -> dict:
    req.body(UNSUBSCRIBE_FIELDS)
    conn = get_connection(req.connection_id)
    list_id = conn.get("listId") if conn else None
    if list_id:
        unsubscribe_connection(req.connection_id, list_id)
        broadcast(list_id, {"type": "presence.left", "listId": list_id, "sub": conn["sub"], "connectionId": req.connection_id})
    return {"statusCode": 200}
