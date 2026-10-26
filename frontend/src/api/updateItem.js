import { request } from "./request.js";

// changes: any of { text, qty, done, position }; qty "" clears it.
export async function updateItem(listId, itemId, changes) {
  const path = `/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`;
  return (await request("PATCH", path, changes)).item;
}
