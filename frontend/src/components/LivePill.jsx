import { displayName } from "../lib/displayName.js";
import "./LivePill.css";
import { t } from "../i18n/i18n.js";

// "Dana here" / "Dana and 2 others here", or the connection state when not live.
export default function LivePill({ status, present, mySub }) {
  if (status !== "live") {
    return <span className="live-pill live-pill-off">{status === "offline" ? t("live.reconnecting") : t("live.connecting")}</span>;
  }
  const others = [...new Map(present.filter((p) => p.sub !== mySub).map((p) => [p.sub, p])).values()];
  if (others.length === 0) return null;
  const first = displayName(others[0].email);
  const label = others.length === 1 ? t("live.here", { name: first }) : t("live.hereMore", { name: first, count: others.length - 1 });
  return (
    <span className="live-pill" title={others.map((p) => p.email).join(", ")}>
      {label}
    </span>
  );
}
