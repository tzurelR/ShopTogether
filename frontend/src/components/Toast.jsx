import { useEffect } from "react";

import "./Toast.css";

// Short notice at the bottom; disappears after 3 seconds or when replaced.
export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
