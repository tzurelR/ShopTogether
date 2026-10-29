import { useState } from "react";

import Alert from "./Alert.jsx";
import TextField from "./TextField.jsx";
import { t } from "../i18n/i18n.js";

// Name field + Save/Cancel, used for both "New list" and "Rename".
export default function ListNameForm({ initialName = "", submitLabel, busyLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <TextField
        id="list-name"
        label={t("lists.nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder={t("lists.namePlaceholder")}
        dir="auto"
        autoFocus
        required
      />
      <Alert>{error}</Alert>
      <div className="sheet-actions">
        <button className="btn btn-ghost" type="button" onClick={onCancel}>{t("common.cancel")}</button>
        <button className="btn" type="submit" disabled={busy || !name.trim()}>
          {busy ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
