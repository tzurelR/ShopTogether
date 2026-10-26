"""Request body validation: declared fields only, typed, with length limits."""

import base64
import json
from dataclasses import dataclass

from helpers.errors import ValidationError


@dataclass(frozen=True)
class Field:
    kind: type  # str, bool, int or float (float also accepts ints)
    required: bool = False
    min_len: int | None = None
    max_len: int | None = None


def parse_json_body(event: dict) -> dict:
    raw = event.get("body") or ""
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    if not raw.strip():
        return {}
    try:
        body = json.loads(raw)
    except json.JSONDecodeError:
        raise ValidationError("The request body is not valid JSON.") from None
    if not isinstance(body, dict):
        raise ValidationError("The request body must be a JSON object.")
    return body


def _check_type(name: str, value, field: Field):
    if field.kind is str:
        if not isinstance(value, str):
            raise ValidationError(f"'{name}' must be a string.")
        value = value.strip()
        if field.min_len is not None and len(value) < field.min_len:
            if field.min_len == 1:
                raise ValidationError(f"'{name}' can't be empty.")
            raise ValidationError(f"'{name}' must be at least {field.min_len} characters.")
        if field.max_len is not None and len(value) > field.max_len:
            raise ValidationError(f"'{name}' must be at most {field.max_len} characters.")
        return value
    # bool is a subclass of int, so check it explicitly both ways.
    if field.kind is bool:
        if not isinstance(value, bool):
            raise ValidationError(f"'{name}' must be true or false.")
        return value
    if field.kind in (int, float):
        allowed = (int,) if field.kind is int else (int, float)
        if isinstance(value, bool) or not isinstance(value, allowed):
            raise ValidationError(f"'{name}' must be a number.")
        return value
    raise TypeError(f"Unsupported field kind for '{name}': {field.kind}")


def validate(body: dict, fields: dict[str, Field], *, require_any: bool = False) -> dict:
    """Return the cleaned body. Unknown fields, wrong types and missing required fields are 400s."""
    unknown = sorted(set(body) - set(fields))
    if unknown:
        raise ValidationError(f"Unknown field(s): {', '.join(unknown)}.")

    cleaned = {}
    for name, field in fields.items():
        if name not in body or body[name] is None:
            if field.required:
                raise ValidationError(f"'{name}' is required.")
            continue
        cleaned[name] = _check_type(name, body[name], field)

    if require_any and not cleaned:
        raise ValidationError(f"Send at least one of: {', '.join(fields)}.")
    return cleaned
