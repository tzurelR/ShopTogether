"""$connect: wss://…?token=<access token>. Returning 401 refuses the socket."""

import time

from db.connections.save_connection import save_connection
from helpers.auth import check_token_source
from helpers.clock import now_iso
from helpers.cognito import get_user
from helpers.constants import CONNECTION_TTL_SECONDS
from helpers.errors import Unauthorized
from helpers.websocket_request import WebsocketRequest


def connect(req: WebsocketRequest) -> dict:
    token = req.query("token")
    if not token:
        raise Unauthorized("Log in to continue.")
    check_token_source(token)
    user = get_user(token)
    save_connection(req.connection_id, user["sub"], user["email"], now_iso(), int(time.time()) + CONNECTION_TTL_SECONDS)
    return {"statusCode": 200}
