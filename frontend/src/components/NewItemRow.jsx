import { useEffect, useRef, useState } from "react";

import { t } from "../i18n/i18n.js";
import { parseItem } from "../lib/parseItem.js";
import "./ItemRow.css";

/**
 * The empty row that "New Item" opens at the end of the list. Return adds the item and
 * leaves a fresh empty row ready for the next one; Return on an empty row (or Esc) closes it.
 * An amount can be typed in the same field: "Milk x2", "2 Milk", "1 kg tomatoes".
 */
export default function NewItemRow({ onAdd, onClose }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const closed = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function close() {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }

  function onKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!text.trim()) return close();
      onAdd(parseItem(text));
      setText("");
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function onBlur() {
    if (text.trim()) onAdd(parseItem(text));
    close();
  }

  return (
    <li className="item item-new">
      <span className="item-check" aria-hidden="true" />
      <div className="item-body">
        <input
          ref={inputRef}
          id="new-item"
          className="item-input"
          aria-label={t("list.newItemLabel")}
          dir="auto"
          value={text}
          maxLength={230}
          enterKeyHint="next"
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
      </div>
    </li>
  );
}
