import { logInWithPassword, refreshTokens } from "./cognito/initiateAuth.js";
import { revokeToken } from "./cognito/revokeToken.js";

// Access and ID tokens live only in memory. The refresh token is kept in localStorage
// so a reload or a new tab stays logged in.
const REFRESH_KEY = "shoptogether.refreshToken";
const REFRESH_EARLY_MS = 5 * 60 * 1000;

let tokens = null; // { accessToken, idToken, expiresAt }
let user = null; // { sub, email }
let refreshTimer = null;
let refreshing = null;
const listeners = new Set();

function readStoredRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function storeRefreshToken(value) {
  try {
    if (value) localStorage.setItem(REFRESH_KEY, value);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Storage blocked (private mode): the session lasts until the tab closes.
  }
}

function decodeClaims(jwt) {
  const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function notify() {
  listeners.forEach((listener) => listener(user));
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  if (!tokens) return;
  const lifetime = tokens.expiresAt - Date.now();
  // 5 minutes early, but never sooner than half the lifetime (avoids a refresh loop on short tokens).
  const delay = Math.max(lifetime - REFRESH_EARLY_MS, lifetime / 2);
  refreshTimer = setTimeout(() => {
    refresh().catch(() => {});
  }, delay);
}

function applyResult(result, refreshToken) {
  tokens = {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
  const claims = decodeClaims(result.IdToken);
  user = { sub: claims.sub, email: claims.email };
  if (refreshToken) storeRefreshToken(refreshToken);
  scheduleRefresh();
  notify();
}

function clear() {
  clearTimeout(refreshTimer);
  tokens = null;
  user = null;
  storeRefreshToken(null);
  notify();
}

/** Get new tokens with the stored refresh token. Concurrent callers share one request. */
function refresh() {
  if (!refreshing) {
    const refreshToken = readStoredRefreshToken();
    refreshing = (async () => {
      if (!refreshToken) throw new Error("Not logged in");
      try {
        applyResult(await refreshTokens(refreshToken));
      } catch (err) {
        // Expired or revoked refresh token: log out. Network errors keep the session.
        if (err.code === "NotAuthorizedException") clear();
        throw err;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function logIn(email, password) {
  const result = await logInWithPassword(email, password);
  applyResult(result, result.RefreshToken);
  return user;
}

export async function logOut() {
  const refreshToken = readStoredRefreshToken();
  clear();
  if (refreshToken) await revokeToken(refreshToken).catch(() => {});
}

/** On app start: resume the session from the stored refresh token, if any. */
export async function restoreSession() {
  if (!readStoredRefreshToken()) return null;
  try {
    await refresh();
  } catch {
    // Signed out (or offline): the guard sends the person to the login page.
  }
  return user;
}

/**
 * A valid access token for API calls. Refreshes when it expires within 5 minutes,
 * or always with `force` (the API client retries a 401 once this way).
 */
export async function getAccessToken({ force = false } = {}) {
  if (force || !tokens || tokens.expiresAt - Date.now() < REFRESH_EARLY_MS) {
    await refresh();
  }
  return tokens.accessToken;
}

export function currentUser() {
  return user;
}

export function onUserChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
