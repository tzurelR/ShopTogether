"""$disconnect: delete the connection rows and tell the list the user left."""

from db.connections.delete_connection import delete_connection
from db.connections.get_connection import get_connection
from helpers.broadcast import broadcast
from helpers.websocket_request import WebsocketRequest


def disconnect(req: WebsocketRequest) -> dict:
    conn = get_connection(req.connection_id)
    if conn is None:
        return {"statusCode": 200}
    list_id = conn.get("listId")
    delete_connection(req.connection_id, list_id)
    if list_id:
        broadcast(list_id, {"type": "presence.left", "listId": list_id, "sub": conn["sub"], "connectionId": req.connection_id})
    return {"statusCode": 200}
