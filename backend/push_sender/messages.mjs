// Notification text per language. {who}, {text}, {list} are filled in by render().
const TEXT = {
  en: {
    "item.created": "{who} added {text}",
    "item.checked": "{who} checked off {text}",
    "member.joined": "{who} joined “{list}”",
    "list.deleted": "{who} deleted “{list}”",
  },
  he: {
    "item.created": "{who} הוסיף/ה {text}",
    "item.checked": "{who} סימן/ה {text}",
    "member.joined": "{who} הצטרף/ה ל„{list}”",
    "list.deleted": "{who} מחק/ה את „{list}”",
  },
};

const isolate = (value) => `⁨${value}⁩`;

/** { title, body } for one event in the subscriber's language. */
export function render(event, lang) {
  const table = TEXT[lang] || TEXT.en;
  const template = table[event.type] || TEXT.en[event.type];
  const body = template.replace(/\{(\w+)\}/g, (_, name) => isolate(event[name] ?? ""));
  const title = event.type === "list.deleted" ? "ShopTogether" : event.list;
  return { title, body };
}
