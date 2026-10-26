"""The caller's identity, from claims the HTTP API JWT authorizer already verified."""

import base64
import json
import os
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


def _unverified_claims(token: str) -> dict:
    try:
        payload = token.split(".")[1]
        return json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    except (IndexError, ValueError):
        raise Unauthorized("Log in to continue.") from None


def check_token_source(token: str) -> None:
    """Reject access tokens that weren't issued by our user pool for our app client.

    The claims aren't verified here; Cognito GetUser verifies the signature afterwards,
    and a token can't claim another pool's issuer without failing that check.
    """
    claims = _unverified_claims(token)
    region = os.environ.get("AWS_REGION", "")
    issuer = f"https://cognito-idp.{region}.amazonaws.com/{os.environ.get('USER_POOL_ID', '')}"
    if (
        claims.get("token_use") != "access"
        or claims.get("iss") != issuer
        or claims.get("client_id") != os.environ.get("USER_POOL_CLIENT_ID")
    ):
        raise Unauthorized("Log in to continue.")
