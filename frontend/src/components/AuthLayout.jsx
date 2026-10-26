import "./AuthLayout.css";

// Shared frame for login, sign up, confirm, forgot password and the invite page.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-head">
          <div className="app-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30">
              <path d="M9 16.5l4.5 4.5L23 11.5" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="auth-brand">ShopTogether</span>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="auth-footer">{footer}</div>}
    </main>
  );
}
