// Calls `callback` when the app comes back to the foreground (switching back to the tab,
// or reopening it from the phone's app switcher). Returns an unsubscribe function.
export function onAppResume(callback) {
  const handler = () => {
    if (document.visibilityState === "visible") callback();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
