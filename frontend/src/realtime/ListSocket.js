import { getAccessToken } from "../auth/session.js";
import { config } from "../config.js";

const PING_MS = 5 * 60 * 1000; // API Gateway drops sockets idle for 10 minutes
const MAX_BACKOFF_MS = 30 * 1000;

/**
 * One WebSocket subscribed to one list. Reconnects with backoff (1, 2, 4 … 30 s)
 * and calls onReconnect after a reconnect so the page can reload what it missed.
 *
 * Callbacks: onMessage(message), onStatus("connecting" | "live" | "offline"), onReconnect().
 */
export class ListSocket {
  constructor(listId, { onMessage, onStatus, onReconnect }) {
    this.listId = listId;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.onReconnect = onReconnect;
    this.socket = null;
    this.stopped = false;
    this.attempt = 0;
    this.everLive = false;
    this.retryTimer = null;
    this.pingTimer = null;
    this.retryNow = () => this.reconnectSoon(0);
  }

  start() {
    window.addEventListener("online", this.retryNow);
    this.connect();
  }

  stop() {
    this.stopped = true;
    window.removeEventListener("online", this.retryNow);
    clearTimeout(this.retryTimer);
    clearInterval(this.pingTimer);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
    }
  }

  async connect() {
    if (this.stopped) return;
    this.onStatus("connecting");
    let token;
    try {
      // After a failed attempt, get a fresh token in case the old one was the problem.
      token = await getAccessToken({ force: this.attempt > 0 });
    } catch {
      return this.reconnectSoon();
    }
    if (this.stopped) return;

    const socket = new WebSocket(`${config.websocketUrl}?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "subscribe", listId: this.listId }));
      clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => this.send({ action: "ping" }), PING_MS);
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === "subscribed") {
        const reconnected = this.everLive;
        this.everLive = true;
        this.attempt = 0;
        this.onStatus("live");
        if (reconnected) this.onReconnect();
      }
      if (message.type !== "pong") this.onMessage(message);
    };

    socket.onclose = () => {
      clearInterval(this.pingTimer);
      if (!this.stopped) this.reconnectSoon();
    };
  }

  reconnectSoon(delay) {
    if (this.stopped) return;
    clearTimeout(this.retryTimer);
    this.onStatus("offline");
    const wait = delay ?? Math.min(1000 * 2 ** this.attempt, MAX_BACKOFF_MS);
    this.attempt += 1;
    this.retryTimer = setTimeout(() => {
      if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
        this.socket.onclose = null;
        this.socket.close();
      }
      this.connect();
    }, wait);
  }

  send(message) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }
}
