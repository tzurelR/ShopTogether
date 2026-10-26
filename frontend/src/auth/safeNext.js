// Only follow in-app paths after login, never another site ("//evil.com", "https://...").
export function safeNext(next) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
