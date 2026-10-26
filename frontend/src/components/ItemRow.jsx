import { useEffect, useRef, useState } from "react";

import "./ItemRow.css";

// One item, Reminders-style: round check, title (tap to edit: Return saves, Esc cancels), qty as a note.
export default function ItemRow({ item, flash = false, onToggle, onEdit, onDelete }) {
  const pending = item.id.startsWith("tmp-");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const inputRef = useRef(null);
  // Return, Esc and blur can all fire as the editor closes; only the first one counts.
  const finished = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    if (pending) return;
    setText(item.text);
    finished.current = false;
    setEditing(true);
  }

  function finish(save) {
    if (finished.current) return;
    finished.current = true;
    setEditing(false);
    if (save && text.trim() && text.trim() !== item.text) onEdit(item, { text: text.trim() });
  }

  function onKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  }

  // Leaving the row saves; moving focus to its Delete button doesn't.
  function onBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) finish(true);
  }

  const classes = ["item", item.done && "item-done", pending && "item-pending", flash && "item-flash"];
  return (
    <li className={classes.filter(Boolean).join(" ")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={item.done ? `Uncheck ${item.text}` : `Check off ${item.text}`}
        className="item-check"
        onClick={() => onToggle(item)}
        disabled={pending}
      />

      <div className="item-body" onBlur={editing ? onBlur : undefined}>
        {editing ? (
          <div className="item-edit">
            <input
              ref={inputRef}
              className="item-input"
              aria-label="Item"
              value={text}
              maxLength={200}
              enterKeyHint="done"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              className="item-delete"
              onClick={() => {
                finished.current = true;
                setEditing(false);
                onDelete(item);
              }}
            >
              Delete
            </button>
          </div>
        ) : (
          <button type="button" className="item-text" onClick={startEditing} disabled={pending}>
            <span className="item-title">{item.text}</span>
            {item.qty && <span className="item-note">{item.qty}</span>}
          </button>
        )}
      </div>
    </li>
  );
}
