import { request } from "./request.js";

// { listId }
export function acceptInvite(token) {
  return request("POST", `/invites/${encodeURIComponent(token)}/accept`);
}
