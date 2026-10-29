"""Remove one device's push subscription."""

from db import keys
from db.table import table


def delete_subscription(sub: str, subscription_id: str) -> None:
    table().delete_item(Key=keys.key(keys.user_pk(sub), keys.push_sk(subscription_id)))
