import { t } from "../i18n/i18n.js";
import { displayName } from "../lib/displayName.js";

/** Toast text for a change someone else made, e.g. "Dana checked off Eggs". */
export function describeEvent(event, { nameOf, previousItem }) {
  const who = displayName(nameOf(event.by));
  switch (event.type) {
    case "item.created":
      return t("event.added", { who, text: event.item.text });
    case "item.updated":
      if (previousItem && previousItem.done !== event.item.done) {
        return t(event.item.done ? "event.checked" : "event.unchecked", { who, text: event.item.text });
      }
      return t("event.edited", { who, text: event.item.text });
    case "item.deleted":
      return t("event.removed", { who, text: event.item.text });
    case "list.updated":
      return t("event.renamed", { who, name: event.list.name });
    case "member.joined":
      return t("event.joined", { who: displayName(event.member.email) });
    case "member.removed":
      return t(event.by === event.member.sub ? "event.left" : "event.removedMember", { who: displayName(event.member.email) });
    default:
      return null;
  }
}
