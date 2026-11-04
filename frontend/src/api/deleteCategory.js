import { request } from "./request.js";

export function deleteCategory(listId, categoryId) {
  return request("DELETE", `/lists/${encodeURIComponent(listId)}/categories/${encodeURIComponent(categoryId)}`);
}
