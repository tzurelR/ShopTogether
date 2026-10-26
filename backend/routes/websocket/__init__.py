from helpers.websocket_request import WebsocketHandler
from routes.websocket.connect import connect
from routes.websocket.disconnect import disconnect
from routes.websocket.ping import ping
from routes.websocket.subscribe import subscribe
from routes.websocket.unsubscribe import unsubscribe

WEBSOCKET_ROUTES: dict[str, WebsocketHandler] = {
    "$connect": connect,
    "$disconnect": disconnect,
    "subscribe": subscribe,
    "unsubscribe": unsubscribe,
    "$default": ping,
}
