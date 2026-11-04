import { request } from "./request.js";

export async function createCategory(listId, name) {
  return (await request("POST", `/lists/${encodeURIComponent(listId)}/categories`, { name })).category;
}
