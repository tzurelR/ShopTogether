import { request } from "./request.js";

export function deleteList(listId) {
  return request("DELETE", `/lists/${encodeURIComponent(listId)}`);
}
