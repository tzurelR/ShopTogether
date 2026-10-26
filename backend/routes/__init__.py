"""Route table: "METHOD /path" (the HTTP API routeKey) -> handler(Request) -> response dict.

Each module exports its own ROUTES dict: lists.py (ST-8), items.py (ST-9),
invites.py and members.py (ST-12).
"""

from helpers.request import Handler
from routes import lists

ROUTES: dict[str, Handler] = {
    **lists.ROUTES,
}
