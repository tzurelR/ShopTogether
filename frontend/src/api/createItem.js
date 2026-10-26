import { request } from "./request.js";

// fields: { text, qty?, done?, position? }
export async function createItem(listId, fields) {
  return (await request("POST", `/lists/${encodeURIComponent(listId)}/items`, fields)).item;
}
