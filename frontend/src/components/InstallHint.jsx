import { useEffect, useState } from "react";

import "./InstallHint.css";

const DISMISSED = "shoptogether.installHintDismissed";

function isInstalled() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOS() {
  const ua = navigator.userAgent || "";
  // iPadOS reports itself as a Mac, so also check for touch.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

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
        <b>Get the app</b>
        {prompt ? (
          <span>Install ShopTogether on your Home Screen for quick access.</span>
        ) : (
          <span>
            Tap <ShareIcon /> <b>Share</b>, then <b>Add to Home Screen</b>.
          </span>
        )}
      </div>
      {prompt ? (
        <button className="install-hint-action" type="button" onClick={install}>Install</button>
      ) : null}
      <button className="install-hint-close" type="button" aria-label="Dismiss" onClick={dismiss}>×</button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-label="Share icon" style={{ verticalAlign: "-2px" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
      <path d="M6 11H5v9h14v-9h-1" />
    </svg>
  );
}
