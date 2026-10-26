"""Delete every LIST#id row, each member's USER row and each invite's INVITE#token row."""

from db import keys
from db.lists.get_list import get_list
from db.table import batch_delete


def delete_list(list_id: str) -> None:
    rows = get_list(list_id)
    extra: list[dict] = []
    for row in rows:
        sk = row["SK"]
        if sk.startswith(keys.MEMBER_PREFIX):
            extra.append(keys.key(keys.user_pk(row["sub"]), keys.list_sk(list_id)))
        elif sk.startswith(keys.INVITE_PREFIX) and row.get("token"):
            extra.append(keys.key(keys.invite_pk(row["token"]), keys.META))
    # USER rows first, so the list leaves everyone's "My lists" even if a later batch fails.
    batch_delete(extra)
    batch_delete([keys.key(row["PK"], row["SK"]) for row in rows])
