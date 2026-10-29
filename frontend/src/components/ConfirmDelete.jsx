import { useState } from "react";

import Alert from "./Alert.jsx";
import { t } from "../i18n/i18n.js";

// In-page confirmation (no browser confirm()).
export default function ConfirmDelete({ message, confirmLabel = t("common.delete"), onConfirm, onCancel }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setError("");
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <p className="muted">{message}</p>
      <Alert>{error}</Alert>
      <div className="sheet-actions">
        <button className="btn btn-ghost" type="button" onClick={onCancel}>{t("common.cancel")}</button>
        <button className="btn btn-danger" type="button" onClick={handleConfirm} disabled={busy}>
          {busy ? t("common.deleting") : confirmLabel}
        </button>
      </div>
    </div>
  );
}
