import { useCallback, useEffect, useState } from "react";

import { createList } from "../api/createList.js";
import { deleteList } from "../api/deleteList.js";
import { getLists } from "../api/getLists.js";
import { updateList } from "../api/updateList.js";
import AccountMenu from "../components/AccountMenu.jsx";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import ListCard from "../components/ListCard.jsx";
import ListNameForm from "../components/ListNameForm.jsx";
import Sheet from "../components/Sheet.jsx";

export default function MyListsPage() {
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
  }, [load]);

  async function handleCreate(name) {
    const list = await createList(name);
    setLists((current) => [list, ...(current ?? [])]);
    close();
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
      <AppBar title="My lists">
        <AccountMenu />
      </AppBar>

      {error && (
        <Alert>
          {error}{" "}
          <button className="btn-link" type="button" onClick={load}>Try again</button>
        </Alert>
      )}

      {lists === null && <p className="muted small">Loading your lists…</p>}

      {lists?.length === 0 && !error && (
        <div className="card stack center">
          <p><b>No lists yet.</b></p>
          <p className="muted small">Press + to make your first one.</p>
        </div>
      )}

      {lists?.length > 0 && (
        <div className="stack">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onRename={(l) => setSheet({ kind: "rename", list: l })}
              onDelete={(l) => setSheet({ kind: "delete", list: l })}
            />
          ))}
        </div>
      )}

      <button className="btn fab" type="button" aria-label="New list" onClick={() => setSheet({ kind: "create" })}>
        +
      </button>

      <Sheet open={sheet?.kind === "create"} title="New list" onClose={close}>
        <ListNameForm submitLabel="Create list" busyLabel="Creating…" onSubmit={handleCreate} onCancel={close} />
      </Sheet>

      <Sheet open={sheet?.kind === "rename"} title="Rename list" onClose={close}>
        <ListNameForm
          initialName={sheet?.list?.name}
          submitLabel="Save"
          busyLabel="Saving…"
          onSubmit={handleRename}
          onCancel={close}
        />
      </Sheet>

      <Sheet open={sheet?.kind === "delete"} title={`Delete “${sheet?.list?.name ?? ""}”?`} onClose={close}>
        <ConfirmDelete
          message="This deletes the list and all its items for everyone it's shared with. You can't undo this."
          confirmLabel="Delete list"
          onConfirm={handleDelete}
          onCancel={close}
        />
      </Sheet>
    </main>
  );
}
