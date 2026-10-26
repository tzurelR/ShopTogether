"""Remove a member: MEMBER row, their USER row and META memberCount, in one transaction."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, transact_write, tx_delete, tx_update


def delete_member(list_id: str, sub: str) -> bool:
    """Returns False if they weren't a member (or the list is gone)."""
    try:
        transact_write([
            tx_delete(
                keys.key(keys.list_pk(list_id), keys.member_sk(sub)),
                condition="attribute_exists(PK)",
            ),
            tx_delete(keys.key(keys.user_pk(sub), keys.list_sk(list_id))),
            tx_update(
                keys.key(keys.list_pk(list_id), keys.META),
                "ADD memberCount :minus_one",
                condition="attribute_exists(PK)",
                values={":minus_one": -1},
            ),
        ])
    except ClientError as err:
        if is_condition_failure(err):
            return False
        raise
    return True
