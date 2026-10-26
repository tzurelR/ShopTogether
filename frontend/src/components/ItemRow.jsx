import { useEffect, useRef, useState } from "react";

import "./ItemRow.css";

// One item: checkbox, text (tap to edit: Enter saves, Escape cancels), qty, remove.
export default function ItemRow({ item, onToggle, onEdit, onDelete }) {
  const pending = item.id.startsWith("tmp-");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [qty, setQty] = useState(item.qty || "");
  const textRef = useRef(null);
  // Enter, Escape and blur can all fire as the editor closes; only the first one counts.
  const finished = useRef(false);

  useEffect(() => {
    if (editing) textRef.current?.focus();
  }, [editing]);

  function startEditing() {
    if (pending) return;
    setText(item.text);
    setQty(item.qty || "");
    finished.current = false;
    setEditing(true);
  }

  function cancel() {
    if (finished.current) return;
    finished.current = true;
    setEditing(false);
  }

  function save() {
    if (finished.current) return;
    finished.current = true;
    setEditing(false);
    const changes = {};
    if (text.trim() && text.trim() !== item.text) changes.text = text.trim();
    if (qty.trim() !== (item.qty || "")) changes.qty = qty.trim();
    if (Object.keys(changes).length) onEdit(item, changes);
  }

  function onKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }

  // Leaving both fields saves; moving focus between them doesn't.
  function onBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) save();
  }

  return (
    <li className={`item${item.done ? " item-done" : ""}${pending ? " item-pending" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={item.done ? `Uncheck ${item.text}` : `Check off ${item.text}`}
        className="item-box"
        onClick={() => onToggle(item)}
        disabled={pending}
      />

      {editing ? (
        <div className="item-edit" onBlur={onBlur}>
          <input
            ref={textRef}
            className="input item-edit-text"
            aria-label="Item"
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <input
            className="input item-edit-qty"
            aria-label="Quantity"
            placeholder="Qty"
            value={qty}
            maxLength={20}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      ) : (
        <button type="button" className="item-text" onClick={startEditing} disabled={pending}>
          <span>{item.text}</span>
          {item.qty && <span className="item-qty">{item.qty}</span>}
        </button>
      )}

      {!editing && (
        <button
          type="button"
          className="item-remove"
          aria-label={`Remove ${item.text}`}
          onClick={() => onDelete(item)}
          disabled={pending}
        >
          ×
        </button>
      )}
    </li>
  );
}
