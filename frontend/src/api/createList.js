import { request } from "./request.js";

export async function createList(name) {
  return (await request("POST", "/lists", { name })).list;
}
