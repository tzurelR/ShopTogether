"""Write META, the owner MEMBER row and the owner USER row in one transaction."""

from db import keys
from db.table import transact_write, tx_put


def create_list(list_id: str, name: str, owner_sub: str, owner_email: str, now: str) -> dict:
    meta = {
        **keys.key(keys.list_pk(list_id), keys.META),
        "listId": list_id,
        "name": name,
        "ownerId": owner_sub,
        "createdAt": now,
        "updatedAt": now,
        "itemCount": 0,
        "doneCount": 0,
        "memberCount": 1,
    }
    member = {
        **keys.key(keys.list_pk(list_id), keys.member_sk(owner_sub)),
        "sub": owner_sub,
        "email": owner_email,
        "role": "owner",
        "joinedAt": now,
    }
    user_row = {
        **keys.key(keys.user_pk(owner_sub), keys.list_sk(list_id)),
        "listId": list_id,
        "role": "owner",
        "joinedAt": now,
    }
    transact_write([
        tx_put(meta, condition="attribute_not_exists(PK)"),
        tx_put(member),
        tx_put(user_row),
    ])
    return meta
