"""Join a list from an invite: MEMBER + USER rows in, both invite rows out, memberCount + 1."""

from botocore.exceptions import ClientError

from db import keys
from db.table import is_condition_failure, transact_write, tx_delete, tx_put, tx_update


def accept_invite(invite: dict, token: str, sub: str, email: str, now: str) -> dict | None:
    """Returns the new MEMBER row, or None if the invite was used or the list deleted meanwhile."""
    list_id = invite["listId"]
    member = {
        **keys.key(keys.list_pk(list_id), keys.member_sk(sub)),
        "sub": sub,
        "email": email,
        "role": "editor",
        "joinedAt": now,
        "invitedBy": invite.get("invitedBy"),
    }
    user_row = {
        **keys.key(keys.user_pk(sub), keys.list_sk(list_id)),
        "listId": list_id,
        "role": "editor",
        "joinedAt": now,
    }
    try:
        transact_write([
            tx_put(member, condition="attribute_not_exists(PK)"),
            tx_put(user_row),
            # Both invite rows must still be this invite, so a token can't be used twice.
            tx_delete(keys.key(keys.invite_pk(token), keys.META), condition="attribute_exists(PK)"),
            tx_delete(
                keys.key(keys.list_pk(list_id), keys.invite_sk(invite["email"])),
                condition="#token = :token",
                names={"#token": "token"},
                values={":token": token},
            ),
            tx_update(
                keys.key(keys.list_pk(list_id), keys.META),
                "ADD memberCount :one",
                condition="attribute_exists(PK)",
                values={":one": 1},
            ),
        ])
    except ClientError as err:
        if is_condition_failure(err):
            return None
        raise
    return member
