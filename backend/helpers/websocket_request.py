"""What a WebSocket route receives: the connection ID, the query string and a validated body."""

from collections.abc import Callable
from dataclasses import dataclass

from helpers.validation import Field, parse_json_body, validate


@dataclass
class WebsocketRequest:
    event: dict
    connection_id: str
    request_id: str

    def query(self, name: str) -> str:
        return (self.event.get("queryStringParameters") or {}).get(name, "")

    def body(self, fields: dict[str, Field]) -> dict:
        return validate(parse_json_body(self.event), fields)


WebsocketHandler = Callable[[WebsocketRequest], dict]
