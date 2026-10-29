import { t } from "../i18n/i18n.js";

// expiresAt is epoch seconds (the DynamoDB TTL value) -> "6 days", "5 hours", "a few minutes".
export function timeLeft(expiresAt) {
  const seconds = expiresAt - Date.now() / 1000;
  if (seconds <= 0) return null;
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return t("time.days", { count: days });
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return t("time.hours", { count: hours });
  return t("time.minutes");
}
