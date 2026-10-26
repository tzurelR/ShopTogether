"""Write both invite rows. Inviting the same email again replaces the old token."""

from botocore.exceptions import ClientError

from db import keys
from db.invites.get_list_invite import get_list_invite
from db.table import is_condition_failure, transact_write, tx_check, tx_delete, tx_put


def create_invite(
    list_id: str,
    email: str,
    token: str,
    invited_by: str,
    invited_by_email: str,
    now: str,
    expires_at: int,
) -> dict | None:
    """Returns the LIST#id / INVITE#email row, or None if the list no longer exists."""
    shared = {
        "listId": list_id,
        "email": email,
        "invitedBy": invited_by,
        "invitedByEmail": invited_by_email,
        "createdAt": now,
        "expiresAt": expires_at,
    }
    list_row = {**keys.key(keys.list_pk(list_id), keys.invite_sk(email)), **shared, "token": token}
    token_row = {**keys.key(keys.invite_pk(token), keys.META), **shared}

    ops = [
        tx_check(keys.key(keys.list_pk(list_id), keys.META), "attribute_exists(PK)"),
        tx_put(list_row),
        tx_put(token_row, condition="attribute_not_exists(PK)"),
    ]
    previous = get_list_invite(list_id, email)
    if previous and previous.get("token") and previous["token"] != token:
        ops.append(tx_delete(keys.key(keys.invite_pk(previous["token"]), keys.META)))

    try:
        transact_write(ops)
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return list_row
