import { Link } from "react-router-dom";

import { t } from "../i18n/i18n.js";
import { listColor } from "../lib/listColor.js";
import Icon from "./Icon.jsx";
import "./ListCard.css";

// One list on "My Lists": tinted icon, name, "7 of 12 left", progress, who it's shared with, ⋯.
// A list with everything checked off turns into a quiet dashed card ("All 9 done").
export default function ListCard({ list, onRename, onDelete }) {
  const total = list.itemCount;
  const left = Math.max(total - list.doneCount, 0);
  const others = Math.max(list.memberCount - 1, 0);
  const allDone = total > 0 && left === 0;
  const percent = total ? Math.round((list.doneCount / total) * 100) : 0;
  const sharing = others > 0 ? t("lists.sharedWith", { count: others }) : t("lists.onlyYou");

  function pick(event, action) {
    event.currentTarget.closest("details").open = false;
    action(list);
  }

  const menu = (
    <details className="list-card-menu" onClick={(e) => e.stopPropagation()}>
      <summary aria-label={t("lists.options", { name: list.name })}>
        <Icon name="more" size={18} />
      </summary>
      <div className="list-card-menu-items">
        <button type="button" onClick={(e) => pick(e, onRename)}>{t("lists.rename")}</button>
        {list.role === "owner" && (
          <button type="button" className="danger" onClick={(e) => pick(e, onDelete)}>{t("common.delete")}</button>
        )}
      </div>
    </details>
  );

  return (
    <li className={`list-card${allDone ? " list-card-done" : ""}`} style={{ "--accent": listColor(list.id) }}>
      <Link to={`/lists/${list.id}`} className="list-card-link">
        <div className="list-card-top">
          <span className="list-card-icon" aria-hidden="true">
            <Icon name={allDone ? "check" : "cart"} size={22} />
          </span>
          <span className="list-card-text">
            <span className="list-card-name" dir="auto">{list.name}</span>
            <span className="list-card-sub">
              {allDone ? t("lists.allDoneCard", { count: total, sharing }) : total ? t("lists.ofLeft", { left, total }) : t("list.noItems")}
            </span>
          </span>
          <Icon name="chevronRight" size={20} className="list-card-chevron" />
        </div>
        {!allDone && (
          <>
            <div className="progress" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
            <div className="list-card-foot">
              {others === 0 && <Icon name="lock" size={16} />}
              <span>{sharing}</span>
            </div>
          </>
        )}
      </Link>
      {menu}
    </li>
  );
}
