import { useState } from "react";

import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";
import "./PersonRow.css";

/**
 * One person (or pending invite) in the share sheet: avatar, name, a status line, and an
 * optional action that asks once before running.
 * `tone` colors the status line: "online" (Here now), "pending" (Invite sent · waiting).
 * `action` = { label, confirm, run, kind: "menu" (⋯ button) | "text" (red word, e.g. Cancel) }.
 */
export default function PersonRow({ avatar, title, detail, tone, action, menuLabel }) {
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
        {avatar}
        <div className="person-text">
          <span className="person-title" dir="auto">{title}</span>
          {detail && <span className={`person-detail${tone ? ` person-${tone}` : ""}`} dir="auto">{detail}</span>}
        </div>
        {action && !confirming && (action.kind === "text" ? (
          <button className="person-text-action" type="button" onClick={() => setConfirming(true)}>{action.label}</button>
        ) : (
          <button className="person-menu" type="button" aria-label={menuLabel} onClick={() => setConfirming(true)}>
            <Icon name="more" size={18} />
          </button>
        ))}
      </div>
      {confirming && (
        <div className="person-confirm">
          <span className="person-confirm-text">{action.confirm}</span>
          <div className="person-confirm-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setConfirming(false)} disabled={busy}>{t("common.cancel")}</button>
            <button className="btn btn-danger" type="button" onClick={run} disabled={busy}>
              {busy ? t("common.working") : action.label}
            </button>
          </div>
        </div>
      )}
      {error && <span className="person-error">{error}</span>}
    </li>
  );
}
