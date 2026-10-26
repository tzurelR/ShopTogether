import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.js";
import ThemePicker from "./ThemePicker.jsx";
import "./AccountMenu.css";

// Avatar button → email, Appearance (Auto / Light / Dark), Log out.
export default function AccountMenu() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  async function onLogOut() {
    await logOut();
    navigate("/login", { replace: true, state: { message: "You're logged out." } });
  }

  return (
    <details className="account">
      <summary className="account-avatar" aria-label="Account and appearance">
        {(user?.email || "?").charAt(0).toUpperCase()}
      </summary>
      <div className="account-menu">
        <div className="account-who">
          <span className="account-avatar account-avatar-lg" aria-hidden="true">
            {(user?.email || "?").charAt(0).toUpperCase()}
          </span>
          <span className="account-email">{user?.email}</span>
        </div>
        <div className="account-section">
          <span className="account-label">Appearance</span>
          <ThemePicker />
        </div>
        <button className="account-logout" type="button" onClick={onLogOut}>
          Log out
        </button>
      </div>
    </details>
  );
}
