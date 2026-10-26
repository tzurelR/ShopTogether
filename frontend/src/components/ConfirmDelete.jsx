import { useState } from "react";

import Alert from "./Alert.jsx";

// In-page confirmation (no browser confirm()).
export default function ConfirmDelete({ message, confirmLabel = "Delete", onConfirm, onCancel }) {
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
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" type="button" onClick={handleConfirm} disabled={busy}>
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}
