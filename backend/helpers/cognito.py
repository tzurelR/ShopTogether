"""Cognito calls made with the user's own access token (no IAM permission needed)."""

from functools import cache

import boto3
from botocore.exceptions import ClientError

from helpers.errors import Unauthorized


@cache
def _client():
    return boto3.client("cognito-idp")


def user_email(access_token: str) -> str:
    """The caller's verified email. Access tokens don't carry it, so ask Cognito."""
    try:
        resp = _client().get_user(AccessToken=access_token)
    except ClientError as err:
        if err.response.get("Error", {}).get("Code") == "NotAuthorizedException":
            raise Unauthorized("Your session has expired. Log in again.") from None
        raise
    attrs = {a["Name"]: a["Value"] for a in resp.get("UserAttributes", [])}
    return attrs.get("email", "").lower()
