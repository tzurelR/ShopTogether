import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { confirmForgotPassword } from "../auth/cognito/confirmForgotPassword.js";
import { forgotPassword } from "../auth/cognito/forgotPassword.js";
import { errorMessage } from "../auth/errorMessage.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordField from "../components/PasswordField.jsx";
import TextField from "../components/TextField.jsx";

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
        state: { message: "Your password is changed. Log in with the new one." },
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (step === "reset") {
    return (
      <AuthLayout
        title="Set a new password"
        subtitle={`If ${email.trim()} has an account, we emailed it a 6-digit code.`}
        footer={<Link to="/login">Back to log in</Link>}
      >
        <form className="stack" onSubmit={resetPassword}>
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
          <PasswordField
            id="new-password"
            label="New password"
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters, with an upper-case letter, a lower-case letter and a number."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Alert>{error}</Alert>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </button>
          <button className="btn-link small" type="button" onClick={() => setStep("email")}>
            Use a different email
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a code to set a new password."
      footer={<Link to="/login">Back to log in</Link>}
    >
      <form className="stack" onSubmit={sendCode}>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send code"}
        </button>
      </form>
    </AuthLayout>
  );
}
