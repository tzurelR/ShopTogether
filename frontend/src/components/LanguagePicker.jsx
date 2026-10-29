import { useContext } from "react";

import { getLanguageChoice, setLanguageChoice, t } from "../i18n/i18n.js";
import { LanguageContext } from "../i18n/LanguageProvider.jsx";
import Segmented from "./Segmented.jsx";

// Auto (follow the device) / English / עברית.
export default function LanguagePicker() {
  // Outside the provider (tests, isolated renders) the choice still saves; it applies on reload.
  const { choice, choose } = useContext(LanguageContext) ?? { choice: getLanguageChoice(), choose: setLanguageChoice };
  return (
    <Segmented
      label={t("account.language")}
      value={choice}
      options={["auto", "en", "he"].map((value) => ({ value, label: t(`language.${value}`) }))}
      onChange={choose}
    />
  );
}
