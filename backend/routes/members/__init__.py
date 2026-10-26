from routes.members.delete_member import deletemember

ROUTES = {
    "DELETE /lists/{listId}/members/{sub}": deletemember,
}
