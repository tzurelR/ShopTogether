import { request } from "./request.js";

// { listId, listName, invitedByEmail, email (masked), expiresAt, alreadyMember }
export function getInvite(token) {
  return request("GET", `/invites/${encodeURIComponent(token)}`);
}
