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
          state: { password, message: "Confirm your email first. We sent you a new code." },
        });
        return;
      }
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      footer={
        <>
          New here? <Link to={withNext("/signup")}>Create an account</Link>
        </>
      }
    >
      <Alert kind="info">
        {location.state?.message ||
          (next.startsWith("/invite/") ? "Someone shared a list with you. Log in, or create an account, to open it." : "")}
      </Alert>
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <Link className="small center auth-link" to={`/forgot?email=${encodeURIComponent(email.trim())}`}>
          Forgot password?
        </Link>
      </form>
    </AuthLayout>
  );
}
