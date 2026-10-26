"""Delete CONN#id / META and, if it watched a list, LIST#id / CONN#id."""

from db import keys
from db.table import batch_delete


def delete_connection(connection_id: str, list_id: str | None) -> None:
    rows = [keys.key(keys.conn_pk(connection_id), keys.META)]
    if list_id:
        rows.append(keys.key(keys.list_pk(list_id), keys.conn_sk(connection_id)))
    batch_delete(rows)
