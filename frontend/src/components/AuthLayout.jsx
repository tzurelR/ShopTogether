import Brand from "./Brand.jsx";
import "./AuthLayout.css";

// Shared frame for login, sign up, confirm and forgot password.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="page auth">
      <Brand />
      <div className="auth-body">
        <div className="auth-head">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="auth-footer small muted center">{footer}</div>}
    </main>
  );
}
