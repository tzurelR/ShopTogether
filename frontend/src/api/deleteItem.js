import { request } from "./request.js";

export function deleteItem(listId, itemId) {
  return request("DELETE", `/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`);
}
