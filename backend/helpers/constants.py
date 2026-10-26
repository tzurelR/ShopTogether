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
