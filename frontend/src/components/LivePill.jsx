import { displayName } from "../lib/displayName.js";
import "./LivePill.css";

// "Dana here" / "Dana and 2 others here", or the connection state when not live.
export default function LivePill({ status, present, mySub }) {
  if (status !== "live") {
    return <span className="live-pill live-pill-off">{status === "offline" ? "Reconnecting…" : "Connecting…"}</span>;
  }
  const others = [...new Map(present.filter((p) => p.sub !== mySub).map((p) => [p.sub, p])).values()];
  if (others.length === 0) return null;
  const first = displayName(others[0].email);
  const label = others.length === 1 ? `${first} here` : `${first} and ${others.length - 1} other${others.length > 2 ? "s" : ""} here`;
  return (
    <span className="live-pill" title={others.map((p) => p.email).join(", ")}>
      {label}
    </span>
  );
}
