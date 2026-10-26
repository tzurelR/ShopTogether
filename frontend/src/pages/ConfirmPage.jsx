import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";

export default function ConfirmPage() {
  return (
    <AuthLayout title="Check your email" subtitle="We sent a 6-digit code to your email." footer="Step 2 of 2 · sign up">
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <TextField
          id="code"
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
        <button className="btn" type="submit">Confirm and continue</button>
        <button className="btn-link small" type="button">Resend code</button>
      </form>
    </AuthLayout>
  );
}
