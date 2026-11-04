import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";
import "./CategoryHeader.css";

// ⋯ in the list's top bar: Delete completed items / Delete all items.
export default function ListMenu({ doneCount, totalCount, onDeleteCompleted, onDeleteAll }) {
  function pick(event, action) {
    event.currentTarget.closest("details").open = false;
    action();
  }

  return (
    <details className="category-menu list-menu">
      <summary className="nav-round" aria-label={t("list.menu")}>
        <Icon name="more" size={20} />
      </summary>
      <div className="category-menu-items">
        {doneCount > 0 && (
          <button type="button" onClick={(e) => pick(e, onDeleteCompleted)}>
            {t("list.deleteCompleted", { count: doneCount })}
          </button>
        )}
        <button type="button" className="danger" onClick={(e) => pick(e, onDeleteAll)} disabled={!totalCount}>
          {t("list.deleteAll")}
        </button>
      </div>
    </details>
  );
}
