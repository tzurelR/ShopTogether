import { useRef, useState } from "react";

import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";

// Invite link card: icon, title, who it's for, Copy. The link itself is shown small underneath
// (and gets selected if the clipboard is blocked, so it can be copied by hand).
export default function CopyLink({ link, title, subtitle }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      ref.current?.select();
    }
  }

  return (
    <div className="invite-link">
      <div className="invite-link-top">
        <span className="invite-link-icon" aria-hidden="true"><Icon name="link" size={20} /></span>
        <span className="invite-link-text">
          <span className="invite-link-title">{title}</span>
          {subtitle && <span className="invite-link-sub">{subtitle}</span>}
        </span>
        <button className="copy-link-button" type="button" onClick={copy}>
          {copied ? t("share.copied") : t("share.copy")}
        </button>
      </div>
      <input ref={ref} className="copy-link-text" value={link} readOnly aria-label={t("share.linkLabel")} dir="ltr" onFocus={(e) => e.target.select()} />
    </div>
  );
}
