import { useEffect, useRef, useState } from "react";

import { t } from "../i18n/i18n.js";
import { parseItem } from "../lib/parseItem.js";
import Icon from "./Icon.jsx";
import "./Composer.css";

/**
 * The bottom sheet for adding items: pick a category chip, type, Return (or ↑) adds and keeps
 * the field open for the next one. An amount can go in the same field: "Bananas x6".
 * Closes with Esc, Return on an empty field, or by tapping elsewhere.
 */
export default function Composer({ categories, group, onGroupChange, onAdd, onClose }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const closed = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function close() {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }

  function add() {
    if (!text.trim()) return false;
    onAdd(parseItem(text), group);
    setText("");
    inputRef.current?.focus();
    return true;
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!add()) close();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  // Leaving the composer (tapping the list) adds what was typed, then closes.
  function onBlur(event) {
    if (formRef.current?.contains(event.relatedTarget)) return;
    if (text.trim()) onAdd(parseItem(text), group);
    close();
  }

  // Chips and the send button must not steal focus from the field (that would close the sheet).
  const keepFocus = (e) => e.preventDefault();
  const chips = [{ id: "", name: t("category.none") }, ...categories];

  return (
    <form ref={formRef} className="composer" onSubmit={onSubmit} onBlur={onBlur}>
      {categories.length > 0 && (
        <div className="composer-chips" role="radiogroup" aria-label={t("composer.addTo")}>
          <span className="composer-chips-label">{t("composer.addTo")}</span>
          {chips.map((c) => (
            <button
              key={c.id || "none"}
              type="button"
              role="radio"
              aria-checked={group === c.id}
              className="chip"
              onMouseDown={keepFocus}
              onClick={() => onGroupChange(c.id)}
              dir="auto"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="composer-row">
        <input
          ref={inputRef}
          id="new-item"
          className="composer-input"
          aria-label={t("list.newItemLabel")}
          placeholder={t("composer.placeholder")}
          dir="auto"
          value={text}
          maxLength={230}
          enterKeyHint="enter"
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="composer-send" aria-label={t("composer.add")} onMouseDown={keepFocus} disabled={!text.trim()}>
          <Icon name="send" size={22} />
        </button>
      </div>
      <span className="composer-tip">{t("composer.tip")}</span>
    </form>
  );
}
