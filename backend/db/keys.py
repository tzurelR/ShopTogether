"""PK/SK builders for every item type in the table (see the data model in blueprint.html)."""

META = "META"


def key(pk: str, sk: str) -> dict:
    return {"PK": pk, "SK": sk}


def user_pk(sub: str) -> str:
    return f"USER#{sub}"


def list_pk(list_id: str) -> str:
    return f"LIST#{list_id}"


def list_sk(list_id: str) -> str:
    return f"LIST#{list_id}"


def item_sk(item_id: str) -> str:
    return f"ITEM#{item_id}"


def member_sk(sub: str) -> str:
    return f"MEMBER#{sub}"


def invite_sk(email: str) -> str:
    return f"INVITE#{email}"


def invite_pk(token: str) -> str:
    return f"INVITE#{token}"


def conn_pk(connection_id: str) -> str:
    return f"CONN#{connection_id}"


def conn_sk(connection_id: str) -> str:
    return f"CONN#{connection_id}"


ITEM_PREFIX = "ITEM#"
MEMBER_PREFIX = "MEMBER#"
INVITE_PREFIX = "INVITE#"
CONN_PREFIX = "CONN#"
