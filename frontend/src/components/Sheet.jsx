import { useEffect, useRef } from "react";

import "./Sheet.css";

// Modal panel (bottom sheet on phones, centered on desktop). Esc and the backdrop close it.
export default function Sheet({ open, title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet-body">
          <h2 className="sheet-title">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
