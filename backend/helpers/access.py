"""Membership checks shared by every /lists/{listId} route."""

from db.members.get_member import get_member
from helpers.errors import Forbidden, NotFound


def list_not_found() -> NotFound:
    # Same answer for "doesn't exist" and "not yours", so IDs can't be probed.
    return NotFound("List not found.")


def require_member(list_id: str, sub: str) -> dict:
    member = get_member(list_id, sub)
    if member is None:
        raise list_not_found()
    return member


def require_owner(list_id: str, sub: str) -> dict:
    member = require_member(list_id, sub)
    if member.get("role") != "owner":
        raise Forbidden("Only the list owner can do that.")
    return member
