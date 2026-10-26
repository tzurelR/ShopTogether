import { getAccessToken } from "../auth/session.js";
import { config } from "../config.js";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function send(method, path, body, token) {
  return fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined && { "Content-Type": "application/json" }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Call the REST API as the logged-in user. Returns the parsed JSON (null for 204).
 * A 401 refreshes the token and retries once; errors throw ApiError with the API's message.
 */
export async function request(method, path, body) {
  let response;
  try {
    response = await send(method, path, body, await getAccessToken());
    if (response.status === 401) {
      response = await send(method, path, body, await getAccessToken({ force: true }));
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.code === "NotAuthorizedException" || err?.message === "Not logged in") {
      throw new ApiError(401, "unauthorized", "Your session has expired. Log in again.");
    }
    throw new ApiError(0, "network", "Can't reach the server. Check your connection and try again.");
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error || {};
    throw new ApiError(
      response.status,
      error.code || "error",
      error.message || (response.status === 401 ? "Your session has expired. Log in again." : "Something went wrong. Try again."),
    );
  }
  return data;
}
