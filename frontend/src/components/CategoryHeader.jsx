import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";
import "./CategoryHeader.css";

// Section title inside a list ("Vegetables 3"), with + (add item here) and ⋯ (rename / delete).
export default function CategoryHeader({ category, count, onAddItem, onRename, onDelete }) {
  function pick(event, action) {
    event.currentTarget.closest("details").open = false;
    action(category);
  }

  return (
    <div className="category-header" data-category-header={category.id}>
      <h2 className="category-name" dir="auto">
        {category.name}
        {count > 0 && <span className="category-count">{count}</span>}
      </h2>
      <button
        type="button"
        className="category-add"
        aria-label={t("category.addItem", { name: category.name })}
        onClick={() => onAddItem(category)}
      >
        <Icon name="plusThin" size={20} />
      </button>
      <details className="category-menu">
        <summary aria-label={t("category.options", { name: category.name })}>
          <Icon name="more" size={18} />
        </summary>
        <div className="category-menu-items">
          <button type="button" onClick={(e) => pick(e, onRename)}>{t("category.renameAction")}</button>
          <button type="button" className="danger" onClick={(e) => pick(e, onDelete)}>{t("category.delete")}</button>
        </div>
      </details>
    </div>
  );
}
