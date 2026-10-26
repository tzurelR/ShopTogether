import { useEffect, useRef, useState } from "react";

import { ListSocket } from "./ListSocket.js";

/**
 * Live connection for the open list.
 * Returns { status, present } where present = [{ sub, email, connectionId }] of everyone viewing it.
 * `onEvent` gets every change event (item.*, list.*, member.*); `onReconnect` fires after a reconnect.
 */
export function useListSocket(listId, { onEvent, onReconnect, enabled = true }) {
  const [status, setStatus] = useState("connecting");
  const [present, setPresent] = useState([]);
  // Keep the latest callbacks without reconnecting when they change.
  const handlers = useRef({ onEvent, onReconnect });
  handlers.current = { onEvent, onReconnect };

  useEffect(() => {
    if (!enabled) return undefined;
    setPresent([]);
    const socket = new ListSocket(listId, {
      onStatus: setStatus,
      onReconnect: () => handlers.current.onReconnect?.(),
      onMessage: (message) => {
        if (message.listId && message.listId !== listId) return;
        switch (message.type) {
          case "subscribed":
            setPresent(message.present || []);
            break;
          case "presence.joined":
            setPresent((current) => [
              ...current.filter((p) => p.connectionId !== message.connectionId),
              { sub: message.sub, email: message.email, connectionId: message.connectionId },
            ]);
            break;
          case "presence.left":
            setPresent((current) => current.filter((p) => p.connectionId !== message.connectionId));
            break;
          case "error":
            break;
          default:
            handlers.current.onEvent?.(message);
        }
      },
    });
    socket.start();
    return () => socket.stop();
  }, [listId, enabled]);

  return { status, present };
}
