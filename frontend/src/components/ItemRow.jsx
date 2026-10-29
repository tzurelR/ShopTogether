import { useEffect, useRef, useState } from "react";

import "./ItemRow.css";

const ACTION_WIDTH = 88; // the red Delete button revealed by a swipe
const FULL_SWIPE = ACTION_WIDTH * 2.2; // swipe this far and let go = delete straight away
const START_SWIPE = 10; // px of sideways movement before a touch counts as a swipe

// One item, Reminders-style: round check, title (tap to edit: Return saves, Esc cancels),
// qty as a note, and swipe left to delete.
export default function ItemRow({ item, flash = false, onToggle, onEdit, onDelete }) {
  const pending = item.id.startsWith("tmp-");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [offset, setOffset] = useState(0); // 0 = closed, -ACTION_WIDTH = Delete showing
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  // Return, Esc, blur and Delete can all fire as the editor closes; only the first one counts.
  const finished = useRef(false);
  const deleted = useRef(false);
  const drag = useRef(null); // { x, y, base, swiping }
  const justSwiped = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function remove() {
    if (deleted.current) return;
    deleted.current = true;
    finished.current = true;
    setEditing(false);
    onDelete(item);
  }

  function startEditing() {
    if (pending) return;
    // A tap on a swiped-open row closes it instead of editing.
    if (justSwiped.current || offset !== 0) {
      justSwiped.current = false;
      setOffset(0);
      return;
    }
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

  // ---------- swipe left to delete (touch and pen; mouse users have the edit Delete) ----------

  function onPointerDown(event) {
    if (pending || editing || event.pointerType === "mouse") return;
    drag.current = { x: event.clientX, y: event.clientY, base: offset, swiping: false };
  }

  function onPointerMove(event) {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.swiping) {
      if (Math.abs(dy) > START_SWIPE && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // a vertical scroll, not a swipe
        return;
      }
      if (Math.abs(dx) < START_SWIPE) return;
      d.swiping = true;
      setDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    setOffset(Math.min(0, Math.max(d.base + dx, -FULL_SWIPE * 1.3)));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.swiping) return;
    setDragging(false);
    justSwiped.current = true; // swallow the click that follows the swipe
    setTimeout(() => (justSwiped.current = false), 50);
    if (offset <= -FULL_SWIPE) remove();
    else setOffset(offset < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0);
  }

  const classes = ["item", item.done && "item-done", pending && "item-pending", flash && "item-flash"];
  return (
    <li className={classes.filter(Boolean).join(" ")}>
      <button
        type="button"
        className="item-swipe-delete"
        style={{ width: Math.max(ACTION_WIDTH, -offset) }}
        aria-hidden={offset === 0}
        tabIndex={offset === 0 ? -1 : 0}
        onClick={remove}
      >
        Delete
      </button>

      <div
        className={`item-slide${dragging ? " item-slide-dragging" : ""}`}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          aria-label={item.done ? `Uncheck ${item.text}` : `Check off ${item.text}`}
          className="item-check"
          onClick={() => (offset ? setOffset(0) : onToggle(item))}
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
                // On phones the input loses focus before the tap's click arrives, which closes
                // the editor and removes this button. Acting on pointer down avoids that race.
                onPointerDown={(e) => {
                  e.preventDefault();
                  remove();
                }}
                onClick={remove}
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
      </div>
    </li>
  );
}
