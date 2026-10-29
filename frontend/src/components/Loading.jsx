import { t } from "../i18n/i18n.js";

export default function Loading() {
  return (
    <main className="page center muted" aria-busy="true">
      <p style={{ marginTop: "max(30vh, env(safe-area-inset-top))" }}>{t("common.loading")}</p>
    </main>
  );
}
