import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.js";
import { disablePush } from "../push/push.js";
import LanguagePicker from "./LanguagePicker.jsx";
import NotificationsToggle from "./NotificationsToggle.jsx";
import ThemePicker from "./ThemePicker.jsx";
import "./AccountMenu.css";
import { t } from "../i18n/i18n.js";

// Avatar button → email, Appearance (Auto / Light / Dark), Log out.
export default function AccountMenu() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  async function onLogOut() {
    // Stop this device's notifications first (needs the session), so the next person
    // to log in here doesn't get yours.
    await disablePush().catch(() => {});
    await logOut();
    navigate("/login", { replace: true, state: { message: t("login.loggedOut") } });
  }

  return (
    <details className="account">
      <summary className="account-avatar" aria-label={t("account.label")}>
        {(user?.email || "?").charAt(0).toUpperCase()}
      </summary>
      <div className="account-menu">
        <div className="account-who">
          <span className="account-avatar account-avatar-lg" aria-hidden="true">
            {(user?.email || "?").charAt(0).toUpperCase()}
          </span>
          <span className="account-email" dir="ltr">{user?.email}</span>
        </div>
        <div className="account-section">
          <span className="account-label">{t("account.appearance")}</span>
          <ThemePicker />
        </div>
        <div className="account-section">
          <span className="account-label">{t("account.language")}</span>
          <LanguagePicker />
        </div>
        <NotificationsToggle />
        <button className="account-logout" type="button" onClick={onLogOut}>
          {t("account.logOut")}
        </button>
      </div>
    </details>
  );
}
