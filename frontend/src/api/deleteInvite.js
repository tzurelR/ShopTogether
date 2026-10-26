import { request } from "./request.js";

export function deleteInvite(listId, email) {
  return request("DELETE", `/lists/${encodeURIComponent(listId)}/invites/${encodeURIComponent(email)}`);
}
