import { request } from "./request.js";

// id = SHA-256 (hex) of the subscription endpoint.
export function deletePushSubscription(id) {
  return request("DELETE", `/push/subscriptions/${id}`);
}
