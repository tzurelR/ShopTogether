// Item order inside a list: by position, then (for items never moved) by ID = creation time.

export function byOrder(a, b) {
  const pa = a.position ?? Infinity;
  const pb = b.position ?? Infinity;
  if (pa !== pb) return pa - pb;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** The category an item shows under: its own, or none if that category no longer exists. */
export function groupOf(item, categoryIds) {
  return item.categoryId && categoryIds.has(item.categoryId) ? item.categoryId : "";
}

/**
 * Where a dropped item goes: a position between its new neighbours.
 * `siblings` is the target group in display order without the dragged item; the item
 * lands before siblings[index]. Returns { position, renumber } — renumber is a list of
 * { item, position } for neighbours that need explicit positions first (items never moved
 * have none, and two very close positions leave no room in between).
 */
export function dropPosition(siblings, index) {
  let positions = siblings.map((s) => s.position);
  const renumber = [];
  const needsFresh =
    positions.some((p) => p == null) ||
    positions.some((p, i) => i > 0 && !(p > positions[i - 1] + 1e-6));
  if (needsFresh) {
    positions = siblings.map((_, i) => i + 1);
    siblings.forEach((s, i) => {
      if (s.position !== positions[i]) renumber.push({ item: s, position: positions[i] });
    });
  }
  const prev = positions[index - 1];
  const next = positions[index];
  let position;
  if (prev != null && next != null) position = (prev + next) / 2;
  else if (prev != null) position = prev + 1;
  else if (next != null) position = next - 1;
  else position = 1;
  return { position, renumber };
}
