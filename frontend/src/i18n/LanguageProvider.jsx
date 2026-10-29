import { createContext, useCallback, useMemo, useState } from "react";

import { currentLanguage, getLanguageChoice, setLanguageChoice } from "./i18n.js";

export const LanguageContext = createContext(null);

/**
 * Holds the language choice. Changing it remounts the app (key={lang}), so every
 * screen re-renders with the new strings and direction without extra wiring.
 */
export default function LanguageProvider({ children }) {
  const [choice, setChoice] = useState(getLanguageChoice);
  const [lang, setLang] = useState(currentLanguage);

  const choose = useCallback((next) => {
    setChoice(next);
    setLang(setLanguageChoice(next));
  }, []);

  const value = useMemo(() => ({ choice, lang, choose }), [choice, lang, choose]);
  return (
    <LanguageContext.Provider value={value}>
      <div key={lang} style={{ display: "contents" }}>{children}</div>
    </LanguageContext.Provider>
  );
}
