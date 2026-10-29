import { useState } from "react";

import { t } from "../i18n/i18n.js";
import { getTheme, setTheme } from "../theme/theme.js";
import Segmented from "./Segmented.jsx";

// Auto (follow the device) / Light / Dark.
export default function ThemePicker() {
  const [theme, setChoice] = useState(getTheme);
  return (
    <Segmented
      label={t("account.appearance")}
      value={theme}
      options={["system", "light", "dark"].map((value) => ({
        value,
        label: t(value === "system" ? "theme.auto" : `theme.${value}`),
      }))}
      onChange={(value) => {
        setChoice(value);
        setTheme(value);
      }}
    />
  );
}
