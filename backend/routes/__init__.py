"""Route table: "METHOD /path" (the HTTP API routeKey) -> handler(Request) -> response dict.

Each package exports its own ROUTES dict: lists/ (ST-8), items/ (ST-9),
invites/ and members/ (ST-12).
"""

from helpers.request import Handler
from routes import items, lists

ROUTES: dict[str, Handler] = {
    **lists.ROUTES,
    **items.ROUTES,
}
