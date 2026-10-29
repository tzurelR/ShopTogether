import { t } from "../i18n/i18n.js";

// We only store emails, so "dana.levi@example.com" becomes "Dana.levi".
export function displayName(email) {
  if (!email) return t("common.someone");
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}
