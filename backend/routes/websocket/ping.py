"""$default: {"action":"ping"} gets {"type":"pong"}; anything else gets an error message."""

from helpers.errors import BadRequest
from helpers.sockets import send
from helpers.validation import parse_json_body
from helpers.websocket_request import WebsocketRequest


def ping(req: WebsocketRequest) -> dict:
    action = parse_json_body(req.event).get("action")
    if action != "ping":
        raise BadRequest(f"Unknown action '{action}'. Use subscribe, unsubscribe or ping.")
    send(req.connection_id, {"type": "pong"})
    return {"statusCode": 200}
