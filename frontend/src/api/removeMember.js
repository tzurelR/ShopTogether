import { request } from "./request.js";

// The owner removes someone, or pass your own sub to leave the list.
export function removeMember(listId, sub) {
  return request("DELETE", `/lists/${encodeURIComponent(listId)}/members/${encodeURIComponent(sub)}`);
}
