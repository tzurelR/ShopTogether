import { useContext } from "react";

import { t } from "../i18n/i18n.js";
import { LanguageContext } from "../i18n/LanguageProvider.jsx";
import Icon from "./Icon.jsx";
import "./AuthLayout.css";

// Shared frame for log in, sign up, confirm, forgot password and the invite page:
// language pill, app icon, brand, big title, subtitle, then the form; footer at the bottom.
export default function AuthLayout({ title, subtitle, children, footer }) {
  const language = useContext(LanguageContext);
  const other = language?.lang === "he" ? "en" : "he";

  return (
    <main className="auth">
      <div className="auth-top">
        {language && (
          <button type="button" className="auth-lang" onClick={() => language.choose(other)} lang={other}>
            {t(`language.${other}`)}
          </button>
        )}
      </div>
      <div className="auth-head">
        <div className="app-icon" aria-hidden="true">
          <Icon name="cartCheck" size={34} />
        </div>
        <div className="auth-titles">
          <span className="auth-brand">{t("app.name")}</span>
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="auth-body">{children}</div>
      {footer && <div className="auth-footer">{footer}</div>}
    </main>
  );
}
