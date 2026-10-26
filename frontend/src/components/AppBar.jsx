import { Link } from "react-router-dom";

import "./AppBar.css";

// iOS-style navigation: small bar (back link + actions) above a large title.
export default function AppBar({ title, subtitle, back, backLabel = "Back", children }) {
  return (
    <header className="nav">
      <div className="nav-bar">
        {back ? (
          <Link to={back} className="nav-back">
            <span aria-hidden="true">‹</span> {backLabel}
          </Link>
        ) : (
          <span />
        )}
        <div className="nav-actions">{children}</div>
      </div>
      <h1 className="large-title">{title}</h1>
      {subtitle && <p className="large-subtitle">{subtitle}</p>}
    </header>
  );
}
