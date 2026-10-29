import { useEffect } from "react";

import "./Toast.css";

/**
 * Short notice at the bottom. `message` is text, or { text, action: { label, onClick } }
 * for a toast with a button (e.g. Undo), which stays a little longer.
 */
export default function Toast({ message, onDone }) {
  const text = typeof message === "string" ? message : message?.text;
  const action = typeof message === "object" ? message?.action : null;

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDone, action ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [message, onDone, action]);

  if (!text) return null;
  return (
    <div className={`toast${action ? " toast-action" : ""}`} role="status">
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
