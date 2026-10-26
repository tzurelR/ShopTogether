import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.js";
import "./AccountMenu.css";

// Avatar with the signed-in email and a log out button.
export default function AccountMenu() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  async function onLogOut() {
    await logOut();
    navigate("/login", { replace: true, state: { message: "You're logged out." } });
  }

  return (
    <details className="account">
      <summary className="account-avatar" aria-label="Account">
        {(user?.email || "?").charAt(0).toUpperCase()}
      </summary>
      <div className="account-menu card">
        <p className="small muted account-email">{user?.email}</p>
        <button className="btn btn-ghost" type="button" onClick={onLogOut}>
          Log out
        </button>
      </div>
    </details>
  );
}
