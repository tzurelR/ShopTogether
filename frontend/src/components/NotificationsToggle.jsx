import { useEffect, useState } from "react";

import { t } from "../i18n/i18n.js";
import { currentSubscription, disablePush, enablePush, pushSupport, syncPushLanguage } from "../push/push.js";
import "./NotificationsToggle.css";

// On/off switch for push notifications on this device, with a hint when it can't work here.
export default function NotificationsToggle() {
  const [support, setSupport] = useState(pushSupport);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    currentSubscription()
      .then((sub) => {
        if (!alive) return;
        setOn(Boolean(sub));
        if (sub) syncPushLanguage();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (support === "unconfigured") return null;

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      if (on) {
        await disablePush();
        setOn(false);
      } else {
        await enablePush();
        setOn(true);
      }
    } catch (err) {
      if (err.code === "blocked") setSupport("blocked");
      else if (err.code !== "dismissed") setError(t("push.failed"));
    }
    setBusy(false);
  }

  const hint =
    support === "blocked" ? t("push.blocked")
    : support === "ios-install" ? t("push.iosInstall")
    : support === "unsupported" ? t("push.unsupported")
    : error || t("push.describe");

  return (
    <div className="notify">
      <div className="notify-row">
        <span id="notify-label">{t("account.notifications")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="notify-label"
          className="switch"
          onClick={toggle}
          disabled={busy || support !== "ok"}
        >
          <span className="switch-knob" />
        </button>
      </div>
      <p className={`notify-hint${error ? " notify-error" : ""}`}>{hint}</p>
    </div>
  );
}
