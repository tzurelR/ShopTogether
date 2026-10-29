import { Link } from "react-router-dom";

import { listColor } from "../lib/listColor.js";
import "./ListCard.css";
import { t } from "../i18n/i18n.js";

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="5" cy="6.5" r="1.6" />
        <circle cx="5" cy="12" r="1.6" />
        <circle cx="5" cy="17.5" r="1.6" />
        <rect x="9" y="5.5" width="11" height="2" rx="1" />
        <rect x="9" y="11" width="11" height="2" rx="1" />
        <rect x="9" y="16.5" width="11" height="2" rx="1" />
      </g>
    </svg>
  );
}

// One row on "My Lists": icon, name (+ who it's shared with), open-item count, ⋯ menu.
export default function ListCard({ list, onRename, onDelete }) {
  const left = Math.max(list.itemCount - list.doneCount, 0);
  const others = list.memberCount - 1;

  function pick(event, action) {
    event.currentTarget.closest("details").open = false;
    action(list);
  }

  return (
    <li className="list-row" style={{ "--row-color": listColor(list.id) }}>
      <Link to={`/lists/${list.id}`} className="list-row-link">
        <span className="list-row-icon"><ListIcon /></span>
        <span className="list-row-text">
          <span className="list-row-name" dir="auto">{list.name}</span>
          {others > 0 && <span className="list-row-sub">{t("lists.sharedWith", { count: others })}</span>}
        </span>
        <span className="list-row-count" aria-label={t("lists.left", { count: left })}>{left}</span>
      </Link>

      <details className="list-row-menu">
        <summary aria-label={t("lists.options", { name: list.name })}>⋯</summary>
        <div className="list-row-menu-items">
          <button type="button" onClick={(e) => pick(e, onRename)}>{t("lists.rename")}</button>
          {list.role === "owner" && (
            <button type="button" className="danger" onClick={(e) => pick(e, onDelete)}>{t("common.delete")}</button>
          )}
        </div>
      </details>
    </li>
  );
}
