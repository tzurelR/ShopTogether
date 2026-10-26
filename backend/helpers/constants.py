"""Shared constants: request body fields and limits."""

from helpers.validation import Field

LIST_FIELDS = {"name": Field(str, required=True, min_len=1, max_len=80)}
