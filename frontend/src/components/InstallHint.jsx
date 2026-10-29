import { useEffect, useState } from "react";

import "./InstallHint.css";
import { t } from "../i18n/i18n.js";
import { isInstalled, isIOS } from "../lib/device.js";

const DISMISSED = "shoptogether.installHintDismissed";

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED) === "1";
  } catch {
    return false;
  }
}

/**
 * One-time tip to put the app on the Home Screen. Android/Chrome gets a real Install
 * button (beforeinstallprompt); iPhone gets the Share → Add to Home Screen steps.
 */
export default function InstallHint() {
  const [prompt, setPrompt] = useState(null);
  const [hidden, setHidden] = useState(() => isInstalled() || wasDismissed());

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Storage blocked: the tip comes back next visit.
    }
  }

  async function install() {
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    setPrompt(null);
    dismiss();
  }

  if (hidden || (!prompt && !isIOS())) return null;

  return (
    <div className="install-hint" role="note">
      <img src="/apple-touch-icon.png" alt="" className="install-hint-icon" />
      <div className="install-hint-text">
        <b>{t("install.title")}</b>
        {prompt ? (
          <span>{t("install.android")}</span>
        ) : (
          <span>
            {t("install.iosBefore")} <ShareIcon /> <b>{t("install.iosShare")}</b>{t("install.iosThen")} <b>{t("install.iosAdd")}</b>.
          </span>
        )}
      </div>
      {prompt ? (
        <button className="install-hint-action" type="button" onClick={install}>{t("install.button")}</button>
      ) : null}
      <button className="install-hint-close" type="button" aria-label={t("common.dismiss")} onClick={dismiss}>×</button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" style={{ verticalAlign: "-2px" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
      <path d="M6 11H5v9h14v-9h-1" />
    </svg>
  );
}
