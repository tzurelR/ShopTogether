import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../api/request.js";
import { createItem } from "../api/createItem.js";
import { deleteItem } from "../api/deleteItem.js";
import { getList } from "../api/getList.js";
import { updateItem } from "../api/updateItem.js";
import { useAuth } from "../auth/useAuth.js";
import AddItemForm from "../components/AddItemForm.jsx";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import ItemRow from "../components/ItemRow.jsx";
import LivePill from "../components/LivePill.jsx";
import Toast from "../components/Toast.jsx";
import { displayName } from "../lib/displayName.js";
import { describeEvent } from "../realtime/describeEvent.js";
import { useListSocket } from "../realtime/useListSocket.js";

// Items with a position first (by position), then by ID (= creation time), like the API.
function byOrder(a, b) {
  const pa = a.position ?? Infinity;
  const pb = b.position ?? Infinity;
  if (pa !== pb) return pa - pb;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

let tempCounter = 0;

const FLASH_MS = 1500;

export default function ListPage() {
  const { id: listId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [flashing, setFlashing] = useState({}); // itemId -> true while highlighted
  const [toast, setToast] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [status, setStatus] = useState("loading"); // loading | ready | missing | failed
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getList(listId);
      setList(data.list);
      setItems(data.items);
      setMembers(data.members);
      setStatus("ready");
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 404 ? "missing" : "failed");
      setError(err.message);
    }
  }, [listId]);

  useEffect(() => {
    setStatus("loading");
    load();
  }, [load]);

  // ---------- live updates from other people ----------

  const flash = useCallback((id) => {
    setFlashing((current) => ({ ...current, [id]: true }));
    setTimeout(() => setFlashing(({ [id]: _, ...rest }) => rest), FLASH_MS);
  }, []);

  const clearToast = useCallback(() => setToast(""), []);

  function handleEvent(event) {
    const mine = event.by === user?.sub;
    const nameOf = (sub) =>
      members.find((m) => m.sub === sub)?.email || present.find((p) => p.sub === sub)?.email;

    // These two take you off the page, even when the change came from your own other tab.
    if (event.type === "list.deleted") {
      const by = mine ? "" : ` by ${displayName(nameOf(event.by))}`;
      navigate("/", { replace: true, state: { message: `“${event.list.name}” was deleted${by}.` } });
      return;
    }
    if (event.type === "member.removed" && event.member.sub === user?.sub) {
      const message = mine ? `You left “${list?.name}”.` : `You were removed from “${list?.name}”.`;
      navigate("/", { replace: true, state: { message } });
      return;
    }
    // Changes from you are applied too (your other tabs and devices stay in sync),
    // just without a toast or highlight.
    const previousItem = event.item && itemsRef.current.find((i) => i.id === event.item.id);
    switch (event.type) {
      case "item.created":
        setItems((current) => {
          if (current.some((i) => i.id === event.item.id)) return current;
          // This tab's own add is still waiting for its response, which will swap the
          // placeholder for the real item. Adding the echo now would show it twice.
          if (mine && current.some((i) => i.id.startsWith("tmp-") && i.text === event.item.text)) return current;
          return [...current, event.item];
        });
        break;
      case "item.updated":
        setItems((current) =>
          current.some((i) => i.id === event.item.id)
            ? current.map((i) => (i.id === event.item.id ? event.item : i))
            : [...current, event.item],
        );
        break;
      case "item.deleted":
        setItems((current) => current.filter((i) => i.id !== event.item.id));
        break;
      case "list.updated":
        setList((current) => ({ ...current, name: event.list.name }));
        break;
      case "member.joined":
        setMembers((current) => [...current.filter((m) => m.sub !== event.member.sub), event.member]);
        break;
      case "member.removed":
        setMembers((current) => current.filter((m) => m.sub !== event.member.sub));
        break;
      default:
        return;
    }
    if (mine) return;
    if (event.type === "item.created" || event.type === "item.updated") flash(event.item.id);
    const text = describeEvent(event, { nameOf, previousItem });
    if (text) setToast(text);
  }

  const { status: liveStatus, present } = useListSocket(listId, {
    enabled: status === "ready",
    onEvent: handleEvent,
    onReconnect: load, // pick up anything missed while offline
  });

  const replaceItem = (id, next) => setItems((current) => current.map((i) => (i.id === id ? next : i)));

  // ---------- optimistic changes: apply now, roll back with a message on failure ----------

  async function addItem(fields) {
    setError("");
    const temp = { id: `tmp-${++tempCounter}`, done: false, qty: null, position: null, ...fields };
    setItems((current) => [...current, temp]);
    try {
      const created = await createItem(listId, fields);
      setItems((current) =>
        current.some((i) => i.id === created.id)
          ? current.filter((i) => i.id !== temp.id)
          : current.map((i) => (i.id === temp.id ? created : i)),
      );
    } catch (err) {
      setItems((current) => current.filter((i) => i.id !== temp.id));
      setError(`Couldn't add “${fields.text}”. ${err.message}`);
    }
  }

  async function changeItem(item, changes) {
    setError("");
    replaceItem(item.id, { ...item, ...changes, qty: changes.qty === "" ? null : (changes.qty ?? item.qty) });
    try {
      replaceItem(item.id, await updateItem(listId, item.id, changes));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setItems((current) => current.filter((i) => i.id !== item.id));
      } else {
        replaceItem(item.id, item);
      }
      setError(`Couldn't save “${item.text}”. ${err.message}`);
    }
  }

  async function removeItem(item) {
    setError("");
    const index = items.findIndex((i) => i.id === item.id);
    setItems((current) => current.filter((i) => i.id !== item.id));
    try {
      await deleteItem(listId, item.id);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        setItems((current) => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, item);
          return next;
        });
        setError(`Couldn't remove “${item.text}”. ${err.message}`);
      }
    }
  }

  if (status === "missing") {
    return (
      <main className="page">
        <AppBar title="List" back="/" />
        <div className="card stack center">
          <p><b>List not found.</b></p>
          <p className="muted small">It may have been deleted, or you're no longer a member.</p>
          <Link to="/">Back to My lists</Link>
        </div>
      </main>
    );
  }

  const open = items.filter((i) => !i.done).sort(byOrder);
  const done = items.filter((i) => i.done).sort(byOrder);
  const rowProps = { onToggle: (i) => changeItem(i, { done: !i.done }), onEdit: changeItem, onDelete: removeItem };

  return (
    <main className="page">
      <AppBar title={list?.name ?? "List"} back="/">
        {status === "ready" && <LivePill status={liveStatus} present={present} mySub={user?.sub} />}
      </AppBar>

      {error && (
        <Alert>
          {error}
          {status === "failed" && (
            <>
              {" "}
              <button className="btn-link" type="button" onClick={load}>Try again</button>
            </>
          )}
        </Alert>
      )}

      {status === "loading" && <p className="muted small">Loading items…</p>}

      {status === "ready" && (
        <>
          {items.length === 0 && <p className="muted small">No items yet. Add the first one below.</p>}
          <ul className="items">
            {open.map((item) => <ItemRow key={item.id} item={item} flash={!!flashing[item.id]} {...rowProps} />)}
          </ul>
          {done.length > 0 && (
            <>
              <div className="done-divider">Done · {done.length}</div>
              <ul className="items">
                {done.map((item) => <ItemRow key={item.id} item={item} flash={!!flashing[item.id]} {...rowProps} />)}
              </ul>
            </>
          )}
          <div className="spacer" />
          <AddItemForm onAdd={addItem} />
        </>
      )}
      <Toast message={toast} onDone={clearToast} />
    </main>
  );
}
