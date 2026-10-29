import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import "./AppBar.css";
import { t } from "../i18n/i18n.js";

// iOS-style navigation: a sticky bar (back + actions) above a large title. Once the
// large title scrolls away, a small copy of it appears in the bar, like Reminders.
export default function AppBar({ title, subtitle, back, backLabel = t("common.back"), children }) {
  const titleRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="nav">
      <div className={`nav-bar${compact ? " nav-bar-compact" : ""}`}>
        <div className="nav-side">
          {back && (
            <Link to={back} className="nav-back">
              <span aria-hidden="true">‹</span> {backLabel}
            </Link>
          )}
        </div>
        <span className="nav-compact-title" aria-hidden="true" dir="auto">{title}</span>
        <div className="nav-side nav-actions">{children}</div>
      </div>
      <h1 ref={titleRef} className="large-title" dir="auto">{title}</h1>
      {subtitle && <p className="large-subtitle">{subtitle}</p>}
    </header>
  );
}
