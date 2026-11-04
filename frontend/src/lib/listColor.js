// Every list gets a stable color from its ID (title, checks, progress), from the design's 8.
const COLORS = ["blue", "orange", "green", "purple", "pink", "teal", "indigo", "red"];

export function listColor(listId = "") {
  let hash = 0;
  for (const ch of listId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `var(--c-${COLORS[hash % COLORS.length]})`;
}
