"""GET /invites/{token}: what the invite page shows before accepting."""

import time

from db.invites.get_invite import get_invite
from db.lists.get_list_meta import get_list_meta
from db.members.get_member import get_member
from helpers.emails import mask_email
from helpers.errors import NotFound
from helpers.request import Request
from helpers.responses import ok


def invite_gone() -> NotFound:
    return NotFound("This invite has expired or was already used. Ask the list owner for a new one.")


def getinvite(req: Request) -> dict:
    invite = get_invite(req.path("token"))
    # TTL deletes lazily, so check the expiry too.
    if invite is None or invite.get("expiresAt", 0) <= time.time():
        raise invite_gone()
    meta = get_list_meta(invite["listId"])
    if meta is None:
        raise invite_gone()
    return ok({
        "listId": invite["listId"],
        "listName": meta["name"],
        "invitedByEmail": invite.get("invitedByEmail"),
        "email": mask_email(invite["email"]),
        "expiresAt": invite["expiresAt"],
        "alreadyMember": get_member(invite["listId"], req.user.sub) is not None,
    })
