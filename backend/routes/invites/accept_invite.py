"""POST /invites/{token}/accept"""

import time

from db.invites.accept_invite import accept_invite
from db.invites.get_invite import get_invite
from db.members.get_member import get_member
from helpers.auth import bearer_token
from helpers.broadcast import broadcast
from helpers.clock import now_iso
from helpers.cognito import user_email
from helpers.emails import mask_email
from helpers.errors import Forbidden
from helpers.request import Request
from helpers.responses import ok
from helpers.views import member_view
from routes.invites.get_invite import invite_gone


def acceptinvite(req: Request) -> dict:
    token = req.path("token")
    invite = get_invite(token)
    if invite is None or invite.get("expiresAt", 0) <= time.time():
        raise invite_gone()
    list_id = invite["listId"]

    email = user_email(bearer_token(req.event))
    if email != invite["email"]:
        raise Forbidden(
            f"This invite was sent to {mask_email(invite['email'])}. Log in with that email to accept."
        )

    if get_member(list_id, req.user.sub) is not None:
        return ok({"listId": list_id})  # already joined (e.g. double click)

    member = accept_invite(invite, token, req.user.sub, email, now_iso())
    if member is None:
        if get_member(list_id, req.user.sub) is not None:
            return ok({"listId": list_id})
        raise invite_gone()

    broadcast(list_id, {"type": "member.joined", "listId": list_id, "by": req.user.sub, "member": member_view(member)})
    return ok({"listId": list_id})
