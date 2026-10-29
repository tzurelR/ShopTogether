"""Save (or refresh) one device's push subscription under USER#sub / PUSH#id."""

from db import keys
from db.table import table


def save_subscription(sub: str, subscription_id: str, fields: dict, now: str) -> None:
    table().put_item(Item={
        **keys.key(keys.user_pk(sub), keys.push_sk(subscription_id)),
        "endpoint": fields["endpoint"],
        "p256dh": fields["p256dh"],
        "auth": fields["auth"],
        "lang": fields.get("lang") or "en",
        "updatedAt": now,
    })
