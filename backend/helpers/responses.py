"""JSON responses in the HTTP API (payload v2) format."""

import json
from decimal import Decimal
from typing import Any

from helpers.errors import ApiError

JSON_HEADERS = {"Content-Type": "application/json"}


def _default(value: Any) -> Any:
    # DynamoDB returns every number as Decimal.
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, set):
        return sorted(value)
    raise TypeError(f"{type(value).__name__} is not JSON serializable")


def json_response(status: int, body: Any = None) -> dict:
    response = {"statusCode": status, "headers": dict(JSON_HEADERS)}
    if body is not None:
        response["body"] = json.dumps(body, default=_default, separators=(",", ":"))
    return response


def ok(body: Any) -> dict:
    return json_response(200, body)


def created(body: Any) -> dict:
    return json_response(201, body)


def no_content() -> dict:
    return {"statusCode": 204}


def error(status: int, code: str, message: str) -> dict:
    return json_response(status, {"error": {"code": code, "message": message}})


def from_api_error(err: ApiError) -> dict:
    return error(err.status, err.code, err.message)
