import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";
import "./AppBar.css";

/**
 * Screen header from the design.
 * - variant "list": back link + round action buttons, then the list-colored title,
 *   a meta row (e.g. "7 left · 5 done" + live pill) and a progress bar. The bar sticks and
 *   shows a small copy of the title once the big one scrolls away.
 * - variant "home": eyebrow (date), big ink title, subtitle, and `children` on the side (avatar).
 */
export default function AppBar({
  title,
  subtitle,
  meta,
  progress,
  eyebrow,
  back,
  backLabel = t("common.back"),
  variant = "list",
  children,
}) {
  const titleRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (variant !== "list" || !el || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [variant]);

  if (variant === "home") {
    return (
      <header className="home-head">
        <div className="home-head-text">
          {eyebrow && <span className="home-eyebrow">{eyebrow}</span>}
          <h1 className="home-title" dir="auto">{title}</h1>
          {subtitle && <p className="home-subtitle">{subtitle}</p>}
        </div>
        {children}
      </header>
    );
  }

  return (
    <header className="nav">
      <div className={`nav-bar${compact ? " nav-bar-compact" : ""}`}>
        <div className="nav-side">
          {back && (
            <Link to={back} className="nav-back">
              <Icon name="chevronLeft" size={24} className="nav-back-icon" />
              {backLabel}
            </Link>
          )}
        </div>
        <span className="nav-compact-title" aria-hidden="true" dir="auto">{title}</span>
        <div className="nav-side nav-actions">{children}</div>
      </div>
      <div className="list-head">
        <h1 ref={titleRef} className="list-title" dir="auto">{title}</h1>
        {(subtitle || meta) && (
          <div className="list-meta">
            {subtitle && <span className="list-meta-text">{subtitle}</span>}
            {meta}
          </div>
        )}
        {progress != null && (
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <i style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </header>
  );
}
