"""Push a message to every socket that has a list open.

Used after every successful write (api Lambda) and for presence (websocket Lambda).
Never raises: a failed push must not fail the write that caused it.
"""

import logging
from concurrent.futures import ThreadPoolExecutor

from db.connections.delete_connection import delete_connection
from db.connections.get_list_connections import get_list_connections
from helpers.constants import BROADCAST_MAX_WORKERS
from helpers.sockets import send

logger = logging.getLogger(__name__)

SENT, GONE, FAILED = "sent", "gone", "failed"


def _push(connection_id: str, message: dict) -> str:
    try:
        return SENT if send(connection_id, message) else GONE
    except Exception:
        logger.exception("Push to %s failed", connection_id)
        return FAILED


def broadcast(
    list_id: str,
    message: dict,
    *,
    exclude: str | None = None,
    connections: list[dict] | None = None,
) -> int:
    """Returns how many sockets received the message.

    Pass `connections` when the LIST#id / CONN# rows were already read (e.g. just before
    deleting the list); otherwise they are queried here.
    """
    try:
        if connections is None:
            connections = get_list_connections(list_id)
        targets = [c["connectionId"] for c in connections if c["connectionId"] != exclude]
        if not targets:
            return 0

        # Pushes run in parallel; only send() runs in the threads (its client is thread-safe).
        workers = min(BROADCAST_MAX_WORKERS, len(targets))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            results = list(pool.map(lambda cid: _push(cid, message), targets))

        # GoneException: the socket closed without $disconnect. Clean up on this thread.
        for connection_id, result in zip(targets, results):
            if result == GONE:
                delete_connection(connection_id, list_id)
        return results.count(SENT)
    except Exception:
        logger.exception("Broadcast %s to list %s failed", message.get("type"), list_id)
        return 0
