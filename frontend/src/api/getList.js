import { request } from "./request.js";

// { list, items, members, invites }
export function getList(listId) {
  return request("GET", `/lists/${encodeURIComponent(listId)}`);
}
