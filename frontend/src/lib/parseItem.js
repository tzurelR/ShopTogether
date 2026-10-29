// One field for both name and amount, like typing a note:
//   "Milk x2", "Milk ×2", "2 Milk", "2x Milk", "1 kg tomatoes", "tomatoes 1 kg", "חלב x2", "2 חלב"
// A bare trailing number ("iPhone 15") is NOT an amount; it needs x/× or a unit.

const NUM = String.raw`\d+(?:[.,]\d+)?`;
const UNITS = String.raw`kg|g|gr|l|ml|lb|lbs|oz|pack|packs|pcs|ק"ג|קג|קילו|גרם|ג'|ליטר|ל'|מ"ל|יח'|יחידות|חבילות|חבילה`;

const LEADING = new RegExp(String.raw`^(${NUM})\s*(?:(${UNITS})\.?(?=\s)|[x×])?\s+(.+)$`, "iu");
const TRAILING_X = new RegExp(String.raw`^(.+?)\s*[x×]\s*(${NUM})$`, "iu");
const TRAILING_UNIT = new RegExp(String.raw`^(.+?)\s+(${NUM})\s*(${UNITS})\.?$`, "iu");

const MAX_QTY = 20; // the API's limit for qty

/** "Milk x2" → { text: "Milk", qty: "2" }; plain text → { text }. */
export function parseItem(input) {
  const raw = input.trim().replace(/\s+/g, " ");
  let m = raw.match(TRAILING_X);
  if (m && m[1].trim()) return withQty(m[1], m[2]);
  m = raw.match(TRAILING_UNIT);
  if (m) return withQty(m[1], `${m[2]} ${m[3]}`);
  m = raw.match(LEADING);
  if (m) return withQty(m[3], m[2] ? `${m[1]} ${m[2]}` : m[1]);
  return { text: raw };
}

function withQty(text, qty) {
  const name = text.trim();
  if (!name || qty.length > MAX_QTY) return { text: [text, qty].join(" ").trim() };
  return { text: name, qty };
}

/** The editable form of an item: "Milk x2" / "Tomatoes 1 kg". */
export function formatItem(item) {
  if (!item.qty) return item.text;
  return /^\d+(?:[.,]\d+)?$/.test(item.qty) ? `${item.text} x${item.qty}` : `${item.text} ${item.qty}`;
}
