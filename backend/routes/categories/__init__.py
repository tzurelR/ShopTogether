from routes.categories.create_category import createcategory
from routes.categories.delete_category import deletecategory
from routes.categories.update_category import updatecategory

ROUTES = {
    "POST /lists/{listId}/categories": createcategory,
    "PATCH /lists/{listId}/categories/{categoryId}": updatecategory,
    "DELETE /lists/{listId}/categories/{categoryId}": deletecategory,
}
