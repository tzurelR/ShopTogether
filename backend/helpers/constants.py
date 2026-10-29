"""Shared constants: request body fields and limits."""

from helpers.validation import Field

LIST_FIELDS = {"name": Field(str, required=True, min_len=1, max_len=80)}

ITEM_TEXT = Field(str, min_len=1, max_len=200)
ITEM_QTY = Field(str, max_len=20)  # "" clears it
ITEM_DONE = Field(bool)
ITEM_POSITION = Field(float)

CREATE_ITEM_FIELDS = {
    "text": Field(str, required=True, min_len=1, max_len=200),  # ITEM_TEXT, but required
    "qty": ITEM_QTY,
    "done": ITEM_DONE,
    "position": ITEM_POSITION,
}
UPDATE_ITEM_FIELDS = {
    "text": ITEM_TEXT,
    "qty": ITEM_QTY,
    "done": ITEM_DONE,
    "position": ITEM_POSITION,
}

# How often an item write is retried when another user changed the same item at the same moment.
ITEM_WRITE_ATTEMPTS = 3

# WebSocket connection rows expire on their own (API Gateway closes sockets after 2 hours anyway).
CONNECTION_TTL_SECONDS = 2 * 60 * 60

SUBSCRIBE_FIELDS = {"action": Field(str), "listId": Field(str, required=True, min_len=1, max_len=64)}
UNSUBSCRIBE_FIELDS = {"action": Field(str), "listId": Field(str, max_len=64)}

# Pushes to a list's sockets run in parallel so 10 subscribers cost about one round trip.
BROADCAST_MAX_WORKERS = 10

INVITE_TTL_SECONDS = 7 * 24 * 60 * 60
INVITE_FIELDS = {"email": Field(str, required=True, min_len=3, max_len=254)}
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

# Web Push subscription from the browser (PushSubscription.toJSON(), flattened).
PUSH_FIELDS = {
    "endpoint": Field(str, required=True, min_len=10, max_len=2048),
    "p256dh": Field(str, required=True, min_len=20, max_len=200),
    "auth": Field(str, required=True, min_len=8, max_len=100),
    "lang": Field(str, max_len=5),
}
PUSH_LANGUAGES = ("en", "he")
