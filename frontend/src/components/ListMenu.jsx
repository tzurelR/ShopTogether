import { t } from "../i18n/i18n.js";
import "./CategoryHeader.css";

// ⋯ in the list's top bar: Delete completed items / Delete all items.
export default function ListMenu({ doneCount, totalCount, onDeleteCompleted, onDeleteAll }) {
  if (!totalCount) return null;

  function pick(event, action) {
    event.currentTarget.closest("details").open = false;
    action();
  }

  return (
    <details className="category-menu list-menu">
      <summary className="nav-icon" aria-label={t("list.menu")}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </summary>
      <div className="category-menu-items">
        {doneCount > 0 && (
          <button type="button" onClick={(e) => pick(e, onDeleteCompleted)}>
            {t("list.deleteCompleted", { count: doneCount })}
          </button>
        )}
        <button type="button" className="danger" onClick={(e) => pick(e, onDeleteAll)}>
          {t("list.deleteAll")}
        </button>
      </div>
    </details>
  );
}
