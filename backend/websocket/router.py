"""Matches the WebSocket routeKey to a route. Errors after $connect go back on the socket."""

import logging

from helpers.errors import ApiError
from helpers.sockets import send
from helpers.websocket_request import WebsocketHandler, WebsocketRequest

logger = logging.getLogger(__name__)


def _report(req: WebsocketRequest, code: str, message: str) -> None:
    try:
        send(req.connection_id, {"type": "error", "code": code, "message": message})
    except Exception:
        logger.exception("Could not send error to %s", req.connection_id)


def dispatch(event: dict, request_id: str, routes: dict[str, WebsocketHandler]) -> dict:
    ctx = event.get("requestContext", {})
    route_key = ctx.get("routeKey", "")
    req = WebsocketRequest(event=event, connection_id=ctx.get("connectionId", ""), request_id=request_id)
    try:
        return routes.get(route_key, routes["$default"])(req)
    except ApiError as err:
        logger.info("%s -> %s %s: %s", route_key, err.status, err.code, err.message)
        if route_key == "$connect":
            return {"statusCode": err.status}  # refuses the handshake
        _report(req, err.code, err.message)
        return {"statusCode": 200}
    except Exception:
        logger.exception("Unhandled error in %s (request %s)", route_key, request_id)
        if route_key != "$connect":
            _report(req, "internal_error", f"Something went wrong. Request ID: {request_id}")
        return {"statusCode": 500}
