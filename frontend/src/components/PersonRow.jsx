import { useState } from "react";

import { displayName } from "../lib/displayName.js";
import "./PersonRow.css";

/**
 * A member or a pending invite in the share sheet.
 * `action` = { label, confirm, run } shows a button that asks once before running.
 */
export default function PersonRow({ email, title, detail, tag, tagKind, action }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      await action.run();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li className="person">
      <div className="person-main">
        <span className="person-avatar" aria-hidden="true">{(email || "?").charAt(0).toUpperCase()}</span>
        <div className="person-text">
          <span className="person-title">{title ?? displayName(email)}</span>
          <span className="person-detail">{detail ?? email}</span>
        </div>
        {tag && <span className={`tag${tagKind ? ` tag-${tagKind}` : ""}`}>{tag}</span>}
        {action && !confirming && (
          <button className="btn-link small" type="button" onClick={() => setConfirming(true)}>
            {action.label}
          </button>
        )}
      </div>
      {confirming && (
        <div className="person-confirm">
          <span className="small">{action.confirm}</span>
          <button className="btn-link small" type="button" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
          <button className="btn-link small person-danger" type="button" onClick={run} disabled={busy}>
            {busy ? "Working…" : action.label}
          </button>
        </div>
      )}
      {error && <span className="small person-danger">{error}</span>}
    </li>
  );
}
