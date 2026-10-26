import { Link } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <TextField id="email" label="Email" type="email" autoComplete="email" required />
        <TextField id="password" label="Password" type="password" autoComplete="current-password" required />
        <button className="btn" type="submit">Log in</button>
        <Link className="small center" to="/forgot">Forgot password?</Link>
      </form>
    </AuthLayout>
  );
}
