export default function Loading() {
  return (
    <main className="page center muted" aria-busy="true">
      <p style={{ marginTop: "max(30vh, env(safe-area-inset-top))" }}>Loading…</p>
    </main>
  );
}
