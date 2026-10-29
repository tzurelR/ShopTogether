"""A subscription's ID: the SHA-256 of its endpoint URL (the browser computes the same)."""

import hashlib


def push_id(endpoint: str) -> str:
    return hashlib.sha256(endpoint.encode()).hexdigest()
