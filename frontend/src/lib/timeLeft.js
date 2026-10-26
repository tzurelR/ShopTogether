// expiresAt is epoch seconds (the DynamoDB TTL value) -> "6 days", "5 hours", "a few minutes".
export function timeLeft(expiresAt) {
  const seconds = expiresAt - Date.now() / 1000;
  if (seconds <= 0) return null;
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return "a few minutes";
}
