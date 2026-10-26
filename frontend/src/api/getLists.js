import { request } from "./request.js";

export async function getLists() {
  return (await request("GET", "/lists")).lists;
}
