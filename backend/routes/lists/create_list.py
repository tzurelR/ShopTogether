"""POST /lists"""

from db.lists.create_list import create_list
from helpers.auth import bearer_token
from helpers.clock import now_iso
from helpers.cognito import user_email
from helpers.ids import new_id
from helpers.request import Request
from helpers.responses import created
from helpers.views import list_view
from helpers.constants import LIST_FIELDS


def createlist(req: Request) -> dict:
    body = req.body(LIST_FIELDS)
    email = user_email(bearer_token(req.event))
    meta = create_list(new_id(), body["name"], req.user.sub, email, now_iso())
    return created({"list": list_view(meta, "owner")})
