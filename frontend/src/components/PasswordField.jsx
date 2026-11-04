import { useState } from "react";

import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";
import "./PasswordField.css";

// Password input with a show/hide button inside the field. `aside` sits on the label row
// (the "Forgot password?" link on the login page).
export default function PasswordField({ id, label, hint, aside, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <div className="password-wrap">
        <input
          id={id}
          name={id}
          className="input password-input"
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          dir="ltr"
          {...inputProps}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={visible}
          aria-controls={id}
          // Keep the cursor in the field when tapping the eye.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={20} />
        </button>
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
