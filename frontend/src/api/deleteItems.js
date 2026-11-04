import { request } from "./request.js";

// scope: "all" | "completed". Returns the deleted items (for Undo).
export async function deleteItems(listId, scope) {
  return (await request("DELETE", `/lists/${encodeURIComponent(listId)}/items?scope=${scope}`)).deleted;
}
