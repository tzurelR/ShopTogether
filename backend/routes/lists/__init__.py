from routes.lists.create_list import createlist
from routes.lists.delete_list import deletelist
from routes.lists.get_list import getlist
from routes.lists.get_lists import getlists
from routes.lists.update_list import updatelist

ROUTES = {
    "GET /lists": getlists,
    "POST /lists": createlist,
    "GET /lists/{listId}": getlist,
    "PATCH /lists/{listId}": updatelist,
    "DELETE /lists/{listId}": deletelist,
}
