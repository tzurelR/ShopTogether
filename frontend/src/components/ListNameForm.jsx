import { useState } from "react";

import Alert from "./Alert.jsx";
import TextField from "./TextField.jsx";
import { t } from "../i18n/i18n.js";

// Name field + Save/Cancel: new list, rename list, new category, rename category.
export default function ListNameForm({ initialName = "", submitLabel, busyLabel, onSubmit, onCancel, label, placeholder, maxLength = 80 }) {
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
        label={label ?? t("lists.nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder ?? t("lists.namePlaceholder")}
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
