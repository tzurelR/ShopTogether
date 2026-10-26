// kind: "error" | "info". Renders nothing without a message.
export default function Alert({ kind = "error", children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
