"""Cancel an invite: delete LIST#id / INVITE#email and INVITE#token / META."""

from db import keys
from db.invites.get_list_invite import get_list_invite
from db.table import transact_write, tx_delete


def delete_invite(list_id: str, email: str) -> dict | None:
    """Returns the deleted invite, or None if there was none."""
    invite = get_list_invite(list_id, email)
    if invite is None:
        return None
    ops = [tx_delete(keys.key(keys.list_pk(list_id), keys.invite_sk(email)))]
    if invite.get("token"):
        ops.append(tx_delete(keys.key(keys.invite_pk(invite["token"]), keys.META)))
    transact_write(ops)
    return invite
