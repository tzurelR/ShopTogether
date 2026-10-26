import { Link } from "react-router-dom";

import "./ListCard.css";

function sharingLabel(list) {
  if (list.memberCount <= 1) return null;
  const others = list.memberCount - 1;
  return `Shared with ${others} ${others === 1 ? "person" : "people"}`;
}

// One list on "My lists": name, progress, sharing, and a ⋯ menu.
export default function ListCard({ list, onRename, onDelete }) {
  const percent = list.itemCount ? Math.round((list.doneCount / list.itemCount) * 100) : 0;
  const shared = sharingLabel(list);

  return (
    <article className="list-card card">
      <Link to={`/lists/${list.id}`} className="list-card-link">
        <div className="list-card-top">
          <b className="list-card-name">{list.name}</b>
          {shared ? null : <span className="tag">Only you</span>}
        </div>
        <span className="small muted">
          {list.doneCount} of {list.itemCount} done
          {shared && ` · ${shared}`}
        </span>
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${percent}%` }} />
        </div>
      </Link>

      <details className="list-card-menu">
        <summary aria-label={`Options for ${list.name}`}>⋯</summary>
        <div className="list-card-menu-items card">
          <button type="button" onClick={(e) => { e.currentTarget.closest("details").open = false; onRename(list); }}>
            Rename
          </button>
          {list.role === "owner" && (
            <button type="button" className="danger" onClick={(e) => { e.currentTarget.closest("details").open = false; onDelete(list); }}>
              Delete
            </button>
          )}
        </div>
      </details>
    </article>
  );
}
