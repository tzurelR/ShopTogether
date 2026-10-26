"""Write the CONN#id / META row when a socket connects."""

from db import keys
from db.table import table


def save_connection(connection_id: str, sub: str, email: str, now: str, expires_at: int) -> None:
    table().put_item(Item={
        **keys.key(keys.conn_pk(connection_id), keys.META),
        "connectionId": connection_id,
        "sub": sub,
        "email": email,
        "connectedAt": now,
        "expiresAt": expires_at,
    })
