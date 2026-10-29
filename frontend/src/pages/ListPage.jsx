import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../api/request.js";
import { createItem } from "../api/createItem.js";
import { deleteItem } from "../api/deleteItem.js";
import { getList } from "../api/getList.js";
import { updateItem } from "../api/updateItem.js";
import { useAuth } from "../auth/useAuth.js";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import BottomBar from "../components/BottomBar.jsx";
import ItemRow from "../components/ItemRow.jsx";
import LivePill from "../components/LivePill.jsx";
import NewItemRow from "../components/NewItemRow.jsx";
import ShareSheet from "../components/ShareSheet.jsx";
import Sheet from "../components/Sheet.jsx";
import Toast from "../components/Toast.jsx";
import { displayName } from "../lib/displayName.js";
import { haptic } from "../lib/haptic.js";
import { listColor } from "../lib/listColor.js";
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
// A checked item stays in place this long before it moves to Completed (like Reminders).
const LINGER_MS = 1200;

export default function ListPage() {
  const { id: listId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [lingering, setLingering] = useState({}); // itemId -> true right after you check it
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
      setInvites(data.invites);
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

  // A just-checked item stays in the open list for a moment before moving to Completed.
  const linger = useCallback((id) => {
    setLingering((current) => ({ ...current, [id]: true }));
    setTimeout(() => setLingering(({ [id]: _, ...rest }) => rest), LINGER_MS);
  }, []);

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
        setInvites((current) => current.filter((i) => i.email !== event.member.email));
        break;
      case "member.removed":
        setMembers((current) => current.filter((m) => m.sub !== event.member.sub));
        break;
      default:
        return;
    }
    if (mine) return;
    if (event.type === "item.created" || event.type === "item.updated") flash(event.item.id);
    // Someone else checked it off: leave it in place briefly so you see it happen.
    if (event.type === "item.updated" && previousItem && !previousItem.done && event.item.done) linger(event.item.id);
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
    haptic(15);
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

  function toggle(item) {
    haptic();
    if (!item.done) linger(item.id);
    changeItem(item, { done: !item.done });
  }

  if (status === "missing") {
    return (
      <main className="page">
        <AppBar title="List" back="/" backLabel="Lists" />
        <div className="card stack center">
          <p><b>List not found.</b></p>
          <p className="muted small">It may have been deleted, or you're no longer a member.</p>
          <Link to="/">Back to My lists</Link>
        </div>
      </main>
    );
  }

  const open = items.filter((i) => !i.done || lingering[i.id]).sort(byOrder);
  const done = items.filter((i) => i.done && !lingering[i.id]).sort(byOrder);
  const rowProps = { onToggle: toggle, onEdit: changeItem, onDelete: removeItem };

  const left = items.filter((i) => !i.done).length;
  return (
    // The list's color tints the title, checks and buttons, like Reminders.
    <main className="page" style={{ "--accent": listColor(listId) }}>
      <AppBar
        title={list?.name ?? ""}
        subtitle={status === "ready" ? (left ? `${left} ${left === 1 ? "item" : "items"} left` : "All done") : null}
        back="/"
        backLabel="Lists"
      >
        {status === "ready" && <LivePill status={liveStatus} present={present} mySub={user?.sub} />}
        {status === "ready" && (
          <button className="nav-button" type="button" onClick={() => setSharing(true)}>
            Share
          </button>
        )}
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
          {open.length === 0 && !adding && (
            <div className="empty">
              <div className="empty-icon" aria-hidden="true">{done.length ? "✓" : "+"}</div>
              <p className="empty-title">{done.length ? "All done" : "Nothing on this list yet"}</p>
              <p className="muted">{done.length ? "Everything is checked off." : "Tap New Item to add the first thing."}</p>
            </div>
          )}
          {(open.length > 0 || adding) && (
            <ul className="items">
              {open.map((item) => <ItemRow key={item.id} item={item} flash={!!flashing[item.id]} {...rowProps} />)}
              {adding && <NewItemRow onAdd={addItem} onClose={() => setAdding(false)} />}
            </ul>
          )}

          {done.length > 0 && (
            <>
              <div className="completed-header">
                <span>{done.length} Completed</span>
                <button type="button" onClick={() => setShowCompleted((v) => !v)}>
                  {showCompleted ? "Hide" : "Show"}
                </button>
              </div>
              {showCompleted && (
                <ul className="items">
                  {done.map((item) => <ItemRow key={item.id} item={item} flash={!!flashing[item.id]} {...rowProps} />)}
                </ul>
              )}
            </>
          )}

          {/* Tapping the empty space under the list starts a new item, like Reminders. */}
          <button type="button" className="tap-to-add" aria-hidden="true" tabIndex={-1} onClick={() => setAdding(true)} />

          <BottomBar
            left={
              <button className="toolbar-button" type="button" onClick={() => setAdding(true)}>
                <span className="toolbar-plus" aria-hidden="true">+</span> New Item
              </button>
            }
          />
        </>
      )}
      <Toast message={toast} onDone={clearToast} />

      <Sheet open={sharing && !!list} title="Share list" onClose={() => setSharing(false)}>
        {list && (
          <ShareSheet
            list={list}
            members={members}
            invites={invites}
            mySub={user?.sub}
            onInvited={(invite) => setInvites((current) => [...current.filter((i) => i.email !== invite.email), invite])}
            onInviteCancelled={(email) => setInvites((current) => current.filter((i) => i.email !== email))}
            onMemberRemoved={(sub) => setMembers((current) => current.filter((m) => m.sub !== sub))}
            onLeft={() => navigate("/", { replace: true, state: { message: `You left “${list.name}”.` } })}
          />
        )}
      </Sheet>
    </main>
  );
}
