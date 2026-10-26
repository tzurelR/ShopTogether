from routes.invites.accept_invite import acceptinvite
from routes.invites.create_invite import createinvite
from routes.invites.delete_invite import deleteinvite
from routes.invites.get_invite import getinvite

ROUTES = {
    "POST /lists/{listId}/invites": createinvite,
    "DELETE /lists/{listId}/invites/{email}": deleteinvite,
    "GET /invites/{token}": getinvite,
    "POST /invites/{token}/accept": acceptinvite,
}
