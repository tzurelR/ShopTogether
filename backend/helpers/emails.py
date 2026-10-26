"""Email address helpers: normalize for comparison, mask for messages."""

import re

from helpers.constants import EMAIL_PATTERN
from helpers.errors import ValidationError


def normalize_email(email: str) -> str:
    email = email.strip().lower()
    if not re.match(EMAIL_PATTERN, email):
        raise ValidationError("Enter a valid email address.")
    return email


def mask_email(email: str) -> str:
    """avi@example.com -> a***@example.com"""
    local, _, domain = email.partition("@")
    return f"{local[:1]}***@{domain}"
