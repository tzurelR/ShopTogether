import { STRINGS } from "./strings.js";

// "auto" follows the device language; "en" / "he" are fixed. The choice is per browser.
const KEY = "shoptogether.language";
export const LANGUAGE_CHOICES = ["auto", "en", "he"];
const RTL = new Set(["he"]);

function readChoice() {
  try {
    const value = localStorage.getItem(KEY);
    return LANGUAGE_CHOICES.includes(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

export function resolveLanguage(choice) {
  if (choice !== "auto") return choice;
  const preferred = typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : [];
  return preferred.some((l) => /^(he|iw)\b/i.test(l || "")) ? "he" : "en";
}

let choice = readChoice();
let lang = resolveLanguage(choice);

export function getLanguageChoice() {
  return choice;
}

export function currentLanguage() {
  return lang;
}

export function isRtl() {
  return RTL.has(lang);
}

/** Sets <html lang dir>. Called at startup and on every change. */
export function applyLanguage() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl() ? "rtl" : "ltr";
}

export function setLanguageChoice(next) {
  choice = next;
  lang = resolveLanguage(next);
  try {
    if (next === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  applyLanguage();
  return lang;
}

// Values (names, item text, list names) are wrapped in Unicode direction isolates, so
// "Dana added חלב" or "דנה הוסיפה Milk" lay out correctly in either direction.
const isolate = (value) => `⁨${value}⁩`;

/** t("items.left", { count: 3 }) → "3 items left". Missing keys fall back to English. */
export function t(key, vars = {}) {
  const table = STRINGS[lang] || STRINGS.en;
  let template = table[key] ?? STRINGS.en[key];
  if (template && typeof template === "object") {
    // Plurals: { one: "...", other: "..." } chosen by vars.count.
    template = vars.count === 1 ? template.one : template.other;
  }
  if (template == null) return key;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] == null ? "" : name === "count" ? String(vars[name]) : isolate(vars[name]),
  );
}
