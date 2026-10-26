import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { signUp } from "../auth/cognito/signUp.js";
import { errorMessage } from "../auth/errorMessage.js";
import Alert from "../components/Alert.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordField from "../components/PasswordField.jsx";
import TextField from "../components/TextField.jsx";

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
      title="Create your account"
      subtitle="Share lists and shop together in real time."
      footer={
        <>
          Already have an account? <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Log in</Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit}>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters, with an upper-case letter, a lower-case letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
