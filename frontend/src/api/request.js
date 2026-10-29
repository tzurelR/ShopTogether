import { getAccessToken } from "../auth/session.js";
import { config } from "../config.js";
import { currentLanguage, t } from "../i18n/i18n.js";

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
      throw new ApiError(401, "unauthorized", t("error.session"));
    }
    throw new ApiError(0, "network", t("error.network"));
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error || {};
    const code = error.code || (response.status === 401 ? "unauthorized" : "error");
    throw new ApiError(response.status, code, localize(code, error.message));
  }
  return data;
}

// The API writes its messages in English. Other languages get a message for the error code.
function localize(code, apiMessage) {
  if (currentLanguage() === "en" && apiMessage) return apiMessage;
  const key = `error.${code}`;
  const text = t(key);
  return text === key ? apiMessage || t("error.generic") : text;
}
