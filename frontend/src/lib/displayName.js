// We only store emails, so "dana.levi@example.com" becomes "Dana.levi".
export function displayName(email) {
  if (!email) return "Someone";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}
