// "system" follows the OS; "light" / "dark" are fixed. The choice is per browser.
const KEY = "shoptogether.theme";
export const THEMES = ["system", "light", "dark"];

export function getTheme() {
  try {
    const value = localStorage.getItem(KEY);
    return THEMES.includes(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function setTheme(theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  applyTheme(theme);
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
