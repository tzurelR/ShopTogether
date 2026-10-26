from routes.items.create_item import createitem
from routes.items.delete_item import deleteitem
from routes.items.update_item import updateitem

ROUTES = {
    "POST /lists/{listId}/items": createitem,
    "PATCH /lists/{listId}/items/{itemId}": updateitem,
    "DELETE /lists/{listId}/items/{itemId}": deleteitem,
}
