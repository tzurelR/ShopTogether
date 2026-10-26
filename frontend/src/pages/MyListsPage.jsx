import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createList } from "../api/createList.js";
import { deleteList } from "../api/deleteList.js";
import { getLists } from "../api/getLists.js";
import { updateList } from "../api/updateList.js";
import AccountMenu from "../components/AccountMenu.jsx";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import BottomBar from "../components/BottomBar.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import ListCard from "../components/ListCard.jsx";
import ListNameForm from "../components/ListNameForm.jsx";
import Sheet from "../components/Sheet.jsx";

// "8 items left in 3 lists" under the title.
function summary(lists) {
  if (!lists?.length) return null;
  const left = lists.reduce((sum, l) => sum + Math.max(l.itemCount - l.doneCount, 0), 0);
  const listsWord = lists.length === 1 ? "list" : "lists";
  if (left === 0) return `All done in ${lists.length} ${listsWord}`;
  return `${left} ${left === 1 ? "item" : "items"} left in ${lists.length} ${listsWord}`;
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
      <AppBar title="My Lists" subtitle={summary(lists)}>
        <AccountMenu />
      </AppBar>

      <Alert kind="info">{location.state?.message}</Alert>

      {error && (
        <Alert>
          {error}{" "}
          <button className="btn-link" type="button" onClick={load}>Try again</button>
        </Alert>
      )}

      {lists === null && <p className="muted small">Loading your lists…</p>}

      {lists?.length === 0 && !error && (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">✓</div>
          <p className="empty-title">No lists yet</p>
          <p className="muted">Tap <b>Add List</b> to make your first one, then share it with the people you shop with.</p>
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
            Add List
          </button>
        }
      />

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
