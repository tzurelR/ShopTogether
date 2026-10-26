"""DELETE /lists/{listId}"""

from db.lists.delete_list import delete_list
from helpers.access import require_owner
from helpers.request import Request
from helpers.responses import no_content


def deletelist(req: Request) -> dict:
    list_id = req.path("listId")
    require_owner(list_id, req.user.sub)
    delete_list(list_id)
    return no_content()
