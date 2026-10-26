"""Timestamps are stored as ISO 8601 UTC strings with milliseconds, so they sort as text."""

from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
