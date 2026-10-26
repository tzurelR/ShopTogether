import { Link } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";

export default function ForgotPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a code to set a new password."
      footer={<Link to="/login">Back to log in</Link>}
    >
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <TextField id="email" label="Email" type="email" autoComplete="email" required />
        <button className="btn" type="submit">Send code</button>
      </form>
    </AuthLayout>
  );
}
