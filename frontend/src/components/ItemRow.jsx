import { useEffect, useRef, useState } from "react";

import { isRtl, t } from "../i18n/i18n.js";
import { formatItem, parseItem } from "../lib/parseItem.js";
import Icon from "./Icon.jsx";
import "./ItemRow.css";

const ACTION_WIDTH = 88; // the red Delete button revealed by a swipe
const FULL_SWIPE = ACTION_WIDTH * 2.2; // swipe this far and let go = delete straight away
const START_SWIPE = 10; // px of sideways movement before a touch counts as a swipe

// Plain numbers read as "×2"; amounts with units ("1 kg") show as typed.
const formatQty = (qty) => (/^\d+(?:[.,]\d+)?$/.test(qty) ? `×${qty}` : qty);

// One item: round check, title (tap to edit: Return saves, Esc cancels), amount pill, ⋮⋮ handle,
// and swipe toward the start edge to delete (left in English, right in Hebrew).
// `note` ("Dana added · just now") shows under the title while the row is highlighted.
export default function ItemRow({ item, flash = false, note = "", lifted = null, onToggle, onEdit, onDelete, onDragStart, onDragMove, onDragEnd }) {
  const pending = item.id.startsWith("tmp-");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(formatItem(item));
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
    setText(formatItem(item));
    finished.current = false;
    setEditing(true);
  }

  function finish(save) {
    if (finished.current) return;
    finished.current = true;
    setEditing(false);
    if (!save || !text.trim()) return;
    // One field holds name and amount ("Milk x2"); only send what changed.
    const next = parseItem(text);
    const changes = {};
    if (next.text !== item.text) changes.text = next.text;
    if ((next.qty || "") !== (item.qty || "")) changes.qty = next.qty || "";
    if (Object.keys(changes).length) onEdit(item, changes);
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
    // Measured toward the row's end edge, so the same code works left-to-right and right-to-left.
    const dx = (event.clientX - d.x) * (isRtl() ? -1 : 1);
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

  const classes = ["item", item.done && "item-done", pending && "item-pending", (flash || note) && "item-flash", lifted != null && "item-lifted"];
  return (
    <li
      className={classes.filter(Boolean).join(" ")}
      data-item-id={item.id}
      style={lifted != null ? { transform: `translateY(${lifted}px)` } : undefined}
    >
      <button
        type="button"
        className="item-swipe-delete"
        // Hidden at rest, so its red never shows through the card's rounded corners.
        style={{ width: Math.max(ACTION_WIDTH, -offset), visibility: offset === 0 && !dragging ? "hidden" : "visible" }}
        aria-hidden={offset === 0}
        tabIndex={offset === 0 ? -1 : 0}
        onClick={remove}
      >
        <Icon name="trash" size={18} />
        {t("common.delete")}
      </button>

      <div
        className={`item-slide${dragging ? " item-slide-dragging" : ""}`}
        style={{ transform: offset ? `translateX(${offset * (isRtl() ? -1 : 1)}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          aria-label={t(item.done ? "item.uncheck" : "item.check", { text: item.text })}
          className="item-check"
          onClick={() => (offset ? setOffset(0) : onToggle(item))}
          disabled={pending}
        >
          {item.done && <Icon name="checkBold" size={16} />}
        </button>

        <div className="item-body" onBlur={editing ? onBlur : undefined}>
          {editing ? (
            <div className="item-edit">
              <input
                ref={inputRef}
                className="item-input"
                aria-label={t("item.label")}
                dir="auto"
                value={text}
                maxLength={230}
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
                {t("common.delete")}
              </button>
            </div>
          ) : (
            <button type="button" className="item-text" onClick={startEditing} disabled={pending}>
              <span className="item-lines">
                <span className="item-title" dir="auto">{item.text}</span>
                {note && <span className="item-note">{note}</span>}
              </span>
              {item.qty && (
                <span className="item-qty" dir="auto" aria-label={t("item.quantity", { qty: item.qty })}>
                  {formatQty(item.qty)}
                </span>
              )}
            </button>
          )}
          {onDragStart && !editing && !pending && (
            <span
              className="item-handle"
              role="button"
              tabIndex={-1}
              aria-label={t("item.move", { text: item.text })}
              // Its own gesture: no swipe, no scroll, no text selection while dragging.
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.currentTarget.setPointerCapture?.(e.pointerId);
                onDragStart(item, e);
              }}
              onPointerMove={(e) => onDragMove?.(e)}
              onPointerUp={(e) => onDragEnd?.(e)}
              onPointerCancel={(e) => onDragEnd?.(e, { cancelled: true })}
            >
              <Icon name="grip" size={18} />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
