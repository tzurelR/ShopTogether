"""Send messages to WebSocket clients through the API Gateway management API."""

import json
import os
import threading
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

_lock = threading.Lock()
_client_instance = None


def _client():
    # Created once under a lock: broadcast() calls send() from several threads.
    global _client_instance
    with _lock:
        if _client_instance is None:
            _client_instance = boto3.client(
                "apigatewaymanagementapi", endpoint_url=os.environ["WEBSOCKET_CALLBACK_URL"]
            )
        return _client_instance


def _default(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    raise TypeError(f"{type(value).__name__} is not JSON serializable")


def send(connection_id: str, message: dict) -> bool:
    """Returns False if the socket is gone (closed without $disconnect)."""
    try:
        _client().post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(message, default=_default, separators=(",", ":")).encode(),
        )
    except ClientError as err:
        if err.response.get("Error", {}).get("Code") == "GoneException":
            return False
        raise
    return True

