import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { confirmSignUp } from "../auth/cognito/confirmSignUp.js";
import { resendCode } from "../auth/cognito/resendCode.js";
import { errorMessage } from "../auth/errorMessage.js";
import { safeNext } from "../auth/safeNext.js";
import { useAuth } from "../auth/useAuth.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";

export default function ConfirmPage() {
  const { logIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const password = location.state?.password;

  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    const address = email.trim().toLowerCase();
    try {
      await confirmSignUp(address, code.trim());
    } catch (err) {
      if (err.code === "ExpiredCodeException") {
        await resendCode(address).catch(() => {});
        setError("That code has expired. We sent a new one.");
      } else {
        setError(errorMessage(err));
      }
      setBusy(false);
      return;
    }

    if (password) {
      try {
        await logIn(address, password);
        navigate(safeNext(next), { replace: true });
        return;
      } catch {
        // Fall through to the login page.
      }
    }
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    navigate(`/login?email=${encodeURIComponent(address)}${nextParam}`, {
      replace: true,
      state: { message: "Your email is confirmed. Log in to continue." },
    });
  }

  async function onResend() {
    setError("");
    setInfo("");
    try {
      await resendCode(email.trim().toLowerCase());
      setInfo("We sent a new code. It can take a minute to arrive.");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const knownEmail = params.get("email");
  return (
    <AuthLayout
      title="Check your email"
      subtitle={knownEmail ? `We sent a 6-digit code to ${knownEmail}.` : "Enter the 6-digit code we emailed you."}
      footer="Step 2 of 2 · sign up"
    >
      <Alert kind="info">{info}</Alert>
      <form className="stack" onSubmit={onSubmit}>
        {!knownEmail && (
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        <TextField
          id="code"
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Confirming…" : "Confirm and continue"}
        </button>
        <button className="btn-link small" type="button" onClick={onResend} disabled={!email}>
          Resend code
        </button>
      </form>
    </AuthLayout>
  );
}
