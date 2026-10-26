import { useState } from "react";

import { getTheme, setTheme } from "../theme/theme.js";
import "./ThemePicker.css";

const LABELS = { system: "Auto", light: "Light", dark: "Dark" };

// Segmented control: Auto (follow the device) / Light / Dark.
export default function ThemePicker() {
  const [theme, setChoice] = useState(getTheme);

  function choose(value) {
    setChoice(value);
    setTheme(value);
  }

  return (
    <div className="segmented" role="radiogroup" aria-label="Appearance">
      {Object.entries(LABELS).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          className="segmented-option"
          onClick={() => choose(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
