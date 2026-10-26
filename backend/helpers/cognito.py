"""Cognito calls made with the user's own access token (no IAM permission needed)."""

from functools import cache

import boto3
from botocore.exceptions import ClientError

from helpers.errors import Unauthorized


@cache
def _client():
    return boto3.client("cognito-idp")


def get_user(access_token: str) -> dict:
    """{"sub", "email"} for a valid token. Cognito checks the signature and expiry."""
    try:
        resp = _client().get_user(AccessToken=access_token)
    except ClientError as err:
        if err.response.get("Error", {}).get("Code") == "NotAuthorizedException":
            raise Unauthorized("Your session has expired. Log in again.") from None
        raise
    attrs = {a["Name"]: a["Value"] for a in resp.get("UserAttributes", [])}
    return {"sub": attrs.get("sub", ""), "email": attrs.get("email", "").lower()}


def user_email(access_token: str) -> str:
    """The caller's verified email. Access tokens don't carry it, so ask Cognito."""
    return get_user(access_token)["email"]
