"""What a route handler receives: the caller, path parameters and a validated body."""

from collections.abc import Callable
from dataclasses import dataclass, field
from urllib.parse import unquote

from helpers.auth import User
from helpers.errors import BadRequest
from helpers.validation import Field, parse_json_body, validate


@dataclass
class Request:
    event: dict
    user: User
    request_id: str
    _body: dict | None = field(default=None, repr=False)

    def path(self, name: str) -> str:
        value = (self.event.get("pathParameters") or {}).get(name)
        if not value:
            raise BadRequest(f"Missing path parameter '{name}'.")
        return unquote(value)

    def body(self, fields: dict[str, Field], *, require_any: bool = False) -> dict:
        if self._body is None:
            self._body = parse_json_body(self.event)
        return validate(self._body, fields, require_any=require_any)


Handler = Callable[[Request], dict]
