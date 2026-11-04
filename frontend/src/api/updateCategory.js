import { request } from "./request.js";

// changes: { name?, position? }
export async function updateCategory(listId, categoryId, changes) {
  const path = `/lists/${encodeURIComponent(listId)}/categories/${encodeURIComponent(categoryId)}`;
  return (await request("PATCH", path, changes)).category;
}
