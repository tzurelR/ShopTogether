"""Lambda entry point for the WebSocket API ($connect, $disconnect, subscribe, unsubscribe, $default)."""

import logging

from routes.websocket import WEBSOCKET_ROUTES
from websocket.router import dispatch

logging.getLogger().setLevel(logging.INFO)


def handler(event, context):
    request_id = getattr(context, "aws_request_id", "local")
    return dispatch(event, request_id, WEBSOCKET_ROUTES)
