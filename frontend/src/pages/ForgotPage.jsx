import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { confirmForgotPassword } from "../auth/cognito/confirmForgotPassword.js";
import { forgotPassword } from "../auth/cognito/forgotPassword.js";
import { errorMessage } from "../auth/errorMessage.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordField from "../components/PasswordField.jsx";
import TextField from "../components/TextField.jsx";
import { t } from "../i18n/i18n.js";

// Two steps on one page: ask for the code, then set the new password with it.
export default function ForgotPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep("reset");
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const address = email.trim().toLowerCase();
    try {
      await confirmForgotPassword(address, code.trim(), password);
      navigate(`/login?email=${encodeURIComponent(address)}`, {
        replace: true,
        state: { message: t("forgot.done") },
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (step === "reset") {
    return (
      <AuthLayout
        title={t("forgot.setTitle")}
        subtitle={t("forgot.sentTo", { email: email.trim() })}
        footer={<Link to="/login">{t("forgot.backToLogin")}</Link>}
      >
        <form className="stack" onSubmit={resetPassword}>
          <TextField
            id="code"
            label={t("auth.code")}
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
          <PasswordField
            id="new-password"
            label={t("auth.newPassword")}
            autoComplete="new-password"
            minLength={8}
            hint={t("auth.passwordHint")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Alert>{error}</Alert>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? t("common.saving") : t("forgot.saveNew")}
          </button>
          <button className="btn-link small" type="button" onClick={() => setStep("email")}>
            {t("forgot.otherEmail")}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      footer={<Link to="/login">{t("forgot.backToLogin")}</Link>}
    >
      <form className="stack" onSubmit={sendCode}>
        <TextField
          id="email"
          label={t("auth.email")}
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t("forgot.sending") : t("forgot.send")}
        </button>
      </form>
    </AuthLayout>
  );
}
