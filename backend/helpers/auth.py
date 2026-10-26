"""The caller's identity, from claims the HTTP API JWT authorizer already verified."""

from dataclasses import dataclass

from helpers.errors import Unauthorized


@dataclass(frozen=True)
class User:
    sub: str
    username: str


def current_user(event: dict) -> User:
    claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
    sub = claims.get("sub")
    if not sub:
        raise Unauthorized("Log in to continue.")
    # Access tokens carry `username`, ID tokens `cognito:username`.
    return User(sub=sub, username=claims.get("username") or claims.get("cognito:username") or sub)


def bearer_token(event: dict) -> str:
    """Raw access token, for Cognito calls made on the user's behalf (e.g. GetUser)."""
    header = event.get("headers", {}).get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise Unauthorized("Log in to continue.")
    return token
