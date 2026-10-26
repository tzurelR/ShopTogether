import { useRef, useState } from "react";

import "./AddItemForm.css";

// Enter adds the item and keeps focus in the field, so you can type the next one.
export default function AddItemForm({ onAdd }) {
  const [text, setText] = useState("");
  const [qty, setQty] = useState("");
  const textRef = useRef(null);

  function onSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), ...(qty.trim() && { qty: qty.trim() }) });
    setText("");
    setQty("");
    textRef.current?.focus();
  }

  return (
    <form className="add-item" onSubmit={onSubmit}>
      <input
        ref={textRef}
        id="new-item"
        className="input add-item-text"
        aria-label="New item"
        placeholder="Add item…"
        value={text}
        maxLength={200}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
      />
      <input
        id="new-item-qty"
        className="input add-item-qty"
        aria-label="Quantity"
        placeholder="Qty"
        value={qty}
        maxLength={20}
        onChange={(e) => setQty(e.target.value)}
        autoComplete="off"
      />
      <button className="btn" type="submit" disabled={!text.trim()}>Add</button>
    </form>
  );
}
