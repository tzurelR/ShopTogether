import { displayName } from "../lib/displayName.js";

/** Toast text for a change someone else made, e.g. "Dana checked off Eggs". */
export function describeEvent(event, { nameOf, previousItem }) {
  const who = displayName(nameOf(event.by));
  switch (event.type) {
    case "item.created":
      return `${who} added ${event.item.text}`;
    case "item.updated":
      if (previousItem && previousItem.done !== event.item.done) {
        return `${who} ${event.item.done ? "checked off" : "unchecked"} ${event.item.text}`;
      }
      return `${who} edited ${event.item.text}`;
    case "item.deleted":
      return `${who} removed ${event.item.text}`;
    case "list.updated":
      return `${who} renamed the list to “${event.list.name}”`;
    case "member.joined":
      return `${displayName(event.member.email)} joined the list`;
    case "member.removed":
      return event.by === event.member.sub
        ? `${displayName(event.member.email)} left the list`
        : `${displayName(event.member.email)} was removed from the list`;
    default:
      return null;
  }
}
