"""DELETE /push/subscriptions/{id} — turn notifications off for this device."""

import re

from db.push.delete_subscription import delete_subscription
from helpers.errors import ValidationError
from helpers.request import Request
from helpers.responses import no_content


def deletesubscription(req: Request) -> dict:
    subscription_id = req.path("id")
    if not re.fullmatch(r"[0-9a-f]{64}", subscription_id):
        raise ValidationError("'id' must be the SHA-256 of the subscription endpoint.")
    delete_subscription(req.user.sub, subscription_id)
    return no_content()
