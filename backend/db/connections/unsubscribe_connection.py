"""Stop a connection watching a list: delete LIST#id / CONN#id and clear listId on CONN#id / META."""

from db import keys
from db.table import transact_write, tx_delete, tx_update


def unsubscribe_connection(connection_id: str, list_id: str) -> None:
    transact_write([
        tx_delete(keys.key(keys.list_pk(list_id), keys.conn_sk(connection_id))),
        tx_update(
            keys.key(keys.conn_pk(connection_id), keys.META),
            "REMOVE listId",
            condition="attribute_exists(PK)",
        ),
    ])
