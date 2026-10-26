"""The CONN#id / META row: who owns the socket and which list it watches."""

from db import keys
from db.table import table


def get_connection(connection_id: str) -> dict | None:
    resp = table().get_item(Key=keys.key(keys.conn_pk(connection_id), keys.META))
    return resp.get("Item")
