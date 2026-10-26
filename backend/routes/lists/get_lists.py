"""GET /lists"""

from db.lists.get_lists import get_lists
from helpers.request import Request
from helpers.responses import ok
from helpers.views import list_view


def getlists(req: Request) -> dict:
    lists = [list_view(meta, meta["role"]) for meta in get_lists(req.user.sub)]
    lists.sort(key=lambda lst: lst["updatedAt"], reverse=True)
    return ok({"lists": lists})
