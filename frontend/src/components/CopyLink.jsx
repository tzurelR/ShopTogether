import { useRef, useState } from "react";

import "./CopyLink.css";

// Read-only link with a Copy button; falls back to selecting the text if the clipboard is blocked.
export default function CopyLink({ link }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      ref.current?.select();
    }
  }

  return (
    <div className="copy-link">
      <input ref={ref} className="input copy-link-text" value={link} readOnly aria-label="Invite link" onFocus={(e) => e.target.select()} />
      <button className="btn btn-ghost" type="button" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
