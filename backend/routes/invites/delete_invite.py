"""DELETE /lists/{listId}/invites/{email}"""

from db.invites.delete_invite import delete_invite
from helpers.access import require_owner
from helpers.emails import normalize_email
from helpers.errors import NotFound
from helpers.request import Request
from helpers.responses import no_content


def deleteinvite(req: Request) -> dict:
    list_id = req.path("listId")
    email = normalize_email(req.path("email"))
    require_owner(list_id, req.user.sub)
    if delete_invite(list_id, email) is None:
        raise NotFound("There's no pending invite for that email.")
    return no_content()
