import { Link } from "react-router-dom";

import "./AppBar.css";

// Top bar for signed-in pages: back link or brand on the left, actions on the right.
export default function AppBar({ title, back, children }) {
  return (
    <header className="app-bar">
      {back ? (
        <Link to={back} className="app-bar-back" aria-label="Back">
          ‹
        </Link>
      ) : null}
      <h1 className="app-bar-title">{title}</h1>
      <div className="spacer" />
      {children}
    </header>
  );
}
