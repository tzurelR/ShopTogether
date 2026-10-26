import { request } from "./request.js";

// { invite, link, emailSent }
export function createInvite(listId, email) {
  return request("POST", `/lists/${encodeURIComponent(listId)}/invites`, { email });
}
