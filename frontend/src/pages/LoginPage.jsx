import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { resendCode } from "../auth/cognito/resendCode.js";
import { errorMessage } from "../auth/errorMessage.js";
import { safeNext } from "../auth/safeNext.js";
import { useAuth } from "../auth/useAuth.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordField from "../components/PasswordField.jsx";
import TextField from "../components/TextField.jsx";
import { t } from "../i18n/i18n.js";

export default function LoginPage() {
  const { logIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const withNext = (path) => (next ? `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}` : path);

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const address = email.trim().toLowerCase();
    try {
      await logIn(address, password);
      navigate(safeNext(next), { replace: true });
    } catch (err) {
      if (err.code === "UserNotConfirmedException") {
        // Signed up but never entered the code: send a fresh one and finish confirming.
        await resendCode(address).catch(() => {});
        navigate(withNext(`/confirm?email=${encodeURIComponent(address)}`), {
          state: { password, message: t("login.confirmFirst") },
        });
        return;
      }
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t("login.title")}
      footer={
        <>
          {t("login.newHere")} <Link to={withNext("/signup")}>{t("login.createAccount")}</Link>
        </>
      }
    >
      <Alert kind="info">
        {location.state?.message ||
          (next.startsWith("/invite/") ? t("login.invited") : "")}
      </Alert>
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t("login.busy") : t("login.submit")}
        </button>
        <Link className="small center auth-link" to={`/forgot?email=${encodeURIComponent(email.trim())}`}>
          {t("login.forgot")}
        </Link>
      </form>
    </AuthLayout>
  );
}
