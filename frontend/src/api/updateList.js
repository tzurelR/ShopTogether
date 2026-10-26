import { request } from "./request.js";

export async function updateList(listId, name) {
  return (await request("PATCH", `/lists/${encodeURIComponent(listId)}`, { name })).list;
}
