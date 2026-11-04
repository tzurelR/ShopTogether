import { useEffect } from "react";

import { avatarColor, initial } from "../lib/avatarColor.js";
import "./Toast.css";

/**
 * Dark notice above the bottom bar. `message` is text, or
 * { text, action: { label, onClick }, from: email } — `from` shows who did it.
 * Stays 4 s, or 5 s when it offers an action (Undo).
 */
export default function Toast({ message, onDone }) {
  const text = typeof message === "string" ? message : message?.text;
  const action = typeof message === "object" ? message?.action : null;
  const from = typeof message === "object" ? message?.from : null;

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDone, action ? 5000 : 4000);
    return () => clearTimeout(timer);
  }, [message, onDone, action]);

  if (!text) return null;
  return (
    <div className="toast" role="status">
      {from && (
        <span className="avatar toast-avatar" style={{ "--avatar": avatarColor(from) }} aria-hidden="true">
          {initial(from)}
        </span>
      )}
      <span className="toast-text">{text}</span>
      {action && (
        <button
          type="button"
          className="toast-button"
          onClick={() => {
            action.onClick();
            onDone();
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
