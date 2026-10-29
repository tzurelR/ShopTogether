"""Push notifications for list changes, sent by the push_sender Lambda.

Who gets one: every member of the list except the person who made the change, and
except anyone who has the list open right now (they already see it live).
Never raises: a failed notification must not fail the write that caused it.
"""

import json
import logging
import os
from functools import cache

import boto3

from db.connections.get_list_connections import get_list_connections
from db.lists.get_list_meta import get_list_meta
from db.members.get_members import get_members
from db.push.get_subscriptions import get_subscriptions

logger = logging.getLogger(__name__)

SUBSCRIPTION_FIELDS = ("PK", "SK", "endpoint", "p256dh", "auth", "lang")


@cache
def _lambda():
    return boto3.client("lambda")


def _name(email: str | None) -> str:
    # Same as the app's displayName(): "dana.levi@example.com" -> "Dana.levi".
    local = (email or "").split("@")[0]
    return local[:1].upper() + local[1:] if local else "Someone"


def notify(
    list_id: str,
    event_type: str,
    actor_sub: str,
    actor_email: str | None,
    *,
    text: str = "",
    list_name: str | None = None,
    members: list[dict] | None = None,
    skip_viewers: bool = True,
) -> int:
    """Queue a notification; returns how many devices it was sent to (0 if push is off).

    event_type: "item.created" | "item.checked" | "member.joined" | "list.deleted".
    Pass `members` / `list_name` when the rows are already deleted (list.deleted).
    """
    function_name = os.environ.get("PUSH_FUNCTION_NAME")
    if not function_name:
        return 0
    try:
        if members is None:
            members = get_members(list_id)
        if list_name is None:
            meta = get_list_meta(list_id)
            list_name = meta["name"] if meta else ""
        viewing = {c.get("sub") for c in get_list_connections(list_id)} if skip_viewers else set()

        subscriptions = []
        for member in members:
            sub = member.get("sub")
            if not sub or sub == actor_sub or sub in viewing:
                continue
            for row in get_subscriptions(sub):
                subscriptions.append({k: row.get(k) for k in SUBSCRIPTION_FIELDS})
        if not subscriptions:
            return 0

        event = {"type": event_type, "listId": list_id, "list": list_name, "who": _name(actor_email), "text": text}
        _lambda().invoke(
            FunctionName=function_name,
            InvocationType="Event",  # fire and forget: the HTTP response doesn't wait
            Payload=json.dumps({"event": event, "subscriptions": subscriptions}).encode(),
        )
        return len(subscriptions)
    except Exception:
        logger.exception("Notify %s for list %s failed", event_type, list_id)
        return 0
