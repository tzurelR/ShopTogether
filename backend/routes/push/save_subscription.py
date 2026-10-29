"""POST /push/subscriptions — turn notifications on for this device."""

from db.push.save_subscription import save_subscription
from helpers.clock import now_iso
from helpers.constants import PUSH_FIELDS, PUSH_LANGUAGES
from helpers.errors import ValidationError
from helpers.push_id import push_id
from helpers.request import Request
from helpers.responses import ok


def savesubscription(req: Request) -> dict:
    body = req.body(PUSH_FIELDS)
    if not body["endpoint"].startswith("https://"):
        raise ValidationError("'endpoint' must be an https URL.")
    if body.get("lang") not in PUSH_LANGUAGES:
        body["lang"] = "en"
    subscription_id = push_id(body["endpoint"])
    save_subscription(req.user.sub, subscription_id, body, now_iso())
    return ok({"id": subscription_id})
