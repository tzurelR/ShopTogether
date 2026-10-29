import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createList } from "../api/createList.js";
import { deleteList } from "../api/deleteList.js";
import { getLists } from "../api/getLists.js";
import { updateList } from "../api/updateList.js";
import { onAppResume } from "../lib/onAppResume.js";
import AccountMenu from "../components/AccountMenu.jsx";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import BottomBar from "../components/BottomBar.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import ListCard from "../components/ListCard.jsx";
import ListNameForm from "../components/ListNameForm.jsx";
import InstallHint from "../components/InstallHint.jsx";
import Sheet from "../components/Sheet.jsx";
import { t } from "../i18n/i18n.js";

// "8 items left in 3 lists" under the title.
function summary(lists) {
  if (!lists?.length) return null;
  const left = lists.reduce((sum, l) => sum + Math.max(l.itemCount - l.doneCount, 0), 0);
  const count = t("lists.count", { count: lists.length });
  if (left === 0) return t("lists.summaryDone", { lists: count });
  return t("lists.summary", { count: left, lists: count });
}

export default function MyListsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lists, setLists] = useState(null); // null while loading
  const [error, setError] = useState("");
  // { kind: "create" } | { kind: "rename", list } | { kind: "delete", list } | null
  const [sheet, setSheet] = useState(null);
  const close = () => setSheet(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setLists(await getLists());
    } catch (err) {
      setError(err.message);
      setLists((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    load();
    return onAppResume(load);
  }, [load]);

  async function handleCreate(name) {
    const list = await createList(name);
    close();
    navigate(`/lists/${list.id}`);
  }

  async function handleRename(name) {
    const updated = await updateList(sheet.list.id, name);
    setLists((current) => current.map((l) => (l.id === updated.id ? { ...l, ...updated, role: l.role } : l)));
    close();
  }

  async function handleDelete() {
    const { id } = sheet.list;
    await deleteList(id);
    setLists((current) => current.filter((l) => l.id !== id));
    close();
  }

  return (
    <main className="page">
      <AppBar title={t("lists.title")} subtitle={summary(lists)}>
        <AccountMenu />
      </AppBar>

      <Alert kind="info">{location.state?.message}</Alert>
      <InstallHint />

      {error && (
        <Alert>
          {error}{" "}
          <button className="btn-link" type="button" onClick={load}>{t("common.tryAgain")}</button>
        </Alert>
      )}

      {lists === null && <p className="muted small">{t("lists.loading")}</p>}

      {lists?.length === 0 && !error && (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">✓</div>
          <p className="empty-title">{t("lists.emptyTitle")}</p>
          <p className="muted">{t("lists.emptyBody")}</p>
        </div>
      )}

      {lists?.length > 0 && (
        <ul className="lists">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onRename={(l) => setSheet({ kind: "rename", list: l })}
              onDelete={(l) => setSheet({ kind: "delete", list: l })}
            />
          ))}
        </ul>
      )}

      <BottomBar
        right={
          <button className="toolbar-button" type="button" onClick={() => setSheet({ kind: "create" })}>
            {t("lists.add")}
          </button>
        }
      />

      <Sheet open={sheet?.kind === "create"} title={t("lists.new")} onClose={close}>
        <ListNameForm submitLabel={t("lists.create")} busyLabel={t("lists.creating")} onSubmit={handleCreate} onCancel={close} />
      </Sheet>

      <Sheet open={sheet?.kind === "rename"} title={t("lists.renameTitle")} onClose={close}>
        <ListNameForm
          initialName={sheet?.list?.name}
          submitLabel={t("common.save")}
          busyLabel={t("common.saving")}
          onSubmit={handleRename}
          onCancel={close}
        />
      </Sheet>

      <Sheet open={sheet?.kind === "delete"} title={t("lists.deleteTitle", { name: sheet?.list?.name ?? "" })} onClose={close}>
        <ConfirmDelete
          message={t("lists.deleteBody")}
          confirmLabel={t("lists.deleteConfirm")}
          onConfirm={handleDelete}
          onCancel={close}
        />
      </Sheet>
    </main>
  );
}
