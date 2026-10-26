"""POST /lists/{listId}/invites"""

import os
import secrets
import time

from db.invites.create_invite import create_invite
from db.lists.get_list_meta import get_list_meta
from db.members.get_members import get_members
from helpers.access import list_not_found, require_owner
from helpers.clock import now_iso
from helpers.constants import INVITE_FIELDS, INVITE_TTL_SECONDS
from helpers.emails import normalize_email
from helpers.errors import Conflict
from helpers.invite_email import send_invite_email
from helpers.request import Request
from helpers.responses import created
from helpers.views import invite_view


def createinvite(req: Request) -> dict:
    list_id = req.path("listId")
    email = normalize_email(req.body(INVITE_FIELDS)["email"])
    owner = require_owner(list_id, req.user.sub)

    if any(m.get("email") == email for m in get_members(list_id)):
        raise Conflict(f"{email} is already a member of this list.")

    token = secrets.token_urlsafe(32)
    invite = create_invite(
        list_id,
        email,
        token,
        invited_by=req.user.sub,
        invited_by_email=owner.get("email", ""),
        now=now_iso(),
        expires_at=int(time.time()) + INVITE_TTL_SECONDS,
    )
    if invite is None:
        raise list_not_found()

    link = f"{os.environ['APP_URL']}/invite/{token}"
    meta = get_list_meta(list_id)
    email_sent = send_invite_email(
        to=email,
        inviter=owner.get("email", "Someone"),
        list_name=meta["name"] if meta else "a list",
        link=link,
    )
    # The link is always returned, so the owner can share it by hand if the email didn't go out.
    return created({"invite": invite_view(invite), "link": link, "emailSent": email_sent})
