import { deletePushSubscription } from "../api/deletePushSubscription.js";
import { savePushSubscription } from "../api/savePushSubscription.js";
import { config } from "../config.js";
import { currentLanguage } from "../i18n/i18n.js";
import { isInstalled, isIOS } from "../lib/device.js";

const SYNCED = "shoptogether.pushSynced"; // "<endpoint>|<lang>" last sent to the server

/** Registers the service worker (notifications now, offline next). Safe to call once at startup. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("Service worker not registered", err));
}

/**
 * "ok" | "blocked" | "ios-install" (iPhone: only installed apps get push) |
 * "unsupported" | "unconfigured" (no VAPID key in this build).
 */
export function pushSupport() {
  if (!config.vapidPublicKey) return "unconfigured";
  const capable = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!capable) return isIOS() && !isInstalled() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return "ok";
}

async function registration() {
  return navigator.serviceWorker.ready;
}

export async function currentSubscription() {
  if (pushSupport() !== "ok") return null;
  return (await registration()).pushManager.getSubscription();
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function remember(value) {
  try {
    if (value) localStorage.setItem(SYNCED, value);
    else localStorage.removeItem(SYNCED);
  } catch {
    // Storage blocked: we just re-send next time.
  }
}

async function send(subscription) {
  const { endpoint, keys } = subscription.toJSON();
  const lang = currentLanguage();
  await savePushSubscription({ endpoint, p256dh: keys.p256dh, auth: keys.auth, lang });
  remember(`${endpoint}|${lang}`);
}

/** Asks for permission (must be called from a tap) and subscribes this device. */
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    const error = new Error(permission === "denied" ? "blocked" : "dismissed");
    error.code = permission === "denied" ? "blocked" : "dismissed";
    throw error;
  }
  const reg = await registration();
  const subscription =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(config.vapidPublicKey) }));
  await send(subscription);
}

/** Unsubscribes this device (also used on log out, so the next person doesn't get your alerts). */
export async function disablePush() {
  const subscription = await currentSubscription();
  remember(null);
  if (!subscription) return;
  const id = await sha256Hex(subscription.endpoint);
  await subscription.unsubscribe().catch(() => {});
  await deletePushSubscription(id).catch(() => {});
}

/** Re-sends the subscription when the language changed, so notifications match the app. */
export async function syncPushLanguage() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  let synced = null;
  try {
    synced = localStorage.getItem(SYNCED);
  } catch {
    // ignore
  }
  if (synced !== `${subscription.endpoint}|${currentLanguage()}`) await send(subscription).catch(() => {});
}
