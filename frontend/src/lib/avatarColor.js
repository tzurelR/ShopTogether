// Initials avatars get a stable color per person.
const COLORS = ["#D14D72", "#1E8C93", "#2D6BCF", "#B8661A", "#8A4FBF", "#2E8B57"];

export function avatarColor(key = "") {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function initial(email = "") {
  return (email || "?").charAt(0).toUpperCase();
}
