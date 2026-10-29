import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { signUp } from "../auth/cognito/signUp.js";
import { errorMessage } from "../auth/errorMessage.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordField from "../components/PasswordField.jsx";
import TextField from "../components/TextField.jsx";
import { t } from "../i18n/i18n.js";

export default function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const address = email.trim().toLowerCase();
    try {
      await signUp(address, password);
      // The password rides along in memory only, so confirming can log straight in.
      navigate(`/confirm?email=${encodeURIComponent(address)}${nextParam}`, { state: { password } });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t("signup.title")}
      subtitle={t("signup.subtitle")}
      footer={
        <>
          {t("signup.haveAccount")} <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>{t("signup.logIn")}</Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit}>
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
        <PasswordField
          id="password"
          label={t("auth.password")}
          autoComplete="new-password"
          minLength={8}
          hint={t("auth.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t("signup.busy") : t("signup.submit")}
        </button>
      </form>
    </AuthLayout>
  );
}
