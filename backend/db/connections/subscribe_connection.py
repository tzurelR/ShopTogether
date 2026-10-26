"""Point a connection at a list: write LIST#id / CONN#id and set listId on CONN#id / META."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, transact_write, tx_put, tx_update


def subscribe_connection(connection_id: str, list_id: str, sub: str, email: str, expires_at: int) -> bool:
    """Returns False if the connection row is gone (socket already closed)."""
    try:
        transact_write([
            tx_put({
                **keys.key(keys.list_pk(list_id), keys.conn_sk(connection_id)),
                "connectionId": connection_id,
                "sub": sub,
                "email": email,
                "expiresAt": expires_at,
            }),
            tx_update(
                keys.key(keys.conn_pk(connection_id), keys.META),
                "SET listId = :list_id",
                condition="attribute_exists(PK)",
                values={":list_id": list_id},
            ),
        ])
    except ClientError as err:
        if is_condition_failure(err):
            return False
        raise
    return True
