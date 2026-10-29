// A short buzz on supported phones (Android). iOS browsers ignore it.
export function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not allowed here; no feedback.
  }
}
