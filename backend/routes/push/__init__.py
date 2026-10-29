from routes.push.delete_subscription import deletesubscription
from routes.push.save_subscription import savesubscription

ROUTES = {
    "POST /push/subscriptions": savesubscription,
    "DELETE /push/subscriptions/{id}": deletesubscription,
}
