"""Table rows -> the JSON the API returns."""


def list_view(meta: dict, role: str) -> dict:
    return {
        "id": meta["listId"],
        "name": meta["name"],
        "ownerId": meta["ownerId"],
        "role": role,
        "itemCount": meta.get("itemCount", 0),
        "doneCount": meta.get("doneCount", 0),
        "memberCount": meta.get("memberCount", 1),
        "createdAt": meta["createdAt"],
        "updatedAt": meta["updatedAt"],
    }


def item_view(row: dict) -> dict:
    return {
        "id": row["itemId"],
        "text": row["text"],
        "qty": row.get("qty"),
        "done": row.get("done", False),
        "position": row.get("position"),
        "updatedBy": row.get("updatedBy"),
        "createdAt": row.get("createdAt"),
        "updatedAt": row.get("updatedAt"),
    }


def member_view(row: dict) -> dict:
    return {"sub": row["sub"], "email": row.get("email"), "role": row["role"], "joinedAt": row.get("joinedAt")}


def invite_view(row: dict) -> dict:
    # Never return the token: it is the secret in the invite link.
    return {"email": row["email"], "invitedBy": row.get("invitedBy"), "expiresAt": row.get("expiresAt")}
