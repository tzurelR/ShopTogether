import { request } from "./request.js";

// { endpoint, p256dh, auth, lang } → { id }
export function savePushSubscription(subscription) {
  return request("POST", "/push/subscriptions", subscription);
}
