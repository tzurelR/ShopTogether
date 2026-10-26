import { Link } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Share lists and shop together in real time."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <TextField id="email" label="Email" type="email" autoComplete="email" required />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with an upper-case letter, a lower-case letter and a number."
          required
        />
        <button className="btn" type="submit">Create account</button>
      </form>
    </AuthLayout>
  );
}
