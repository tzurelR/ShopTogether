import { useEffect, useRef } from "react";

import { t } from "../i18n/i18n.js";
import Icon from "./Icon.jsx";
import "./Sheet.css";

// Bottom sheet (28px top corners, grabber, title + optional subtitle, round ✕).
// Esc, the ✕ and the backdrop close it. Centered card on wide screens.
export default function Sheet({ open, title, subtitle, onClose, children }) {
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
        // Focus lands on the sheet itself, not on the ✕ (which would show a focus ring).
        <div className="sheet-body" tabIndex={-1} autoFocus>
          <span className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-head">
            <div className="sheet-titles">
              <h2 className="sheet-title" dir="auto">{title}</h2>
              {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
            </div>
            <button type="button" className="sheet-close" aria-label={t("common.close")} onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
