import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiError } from "../api/request.js";
import { createItem } from "../api/createItem.js";
import { deleteItem } from "../api/deleteItem.js";
import { getList } from "../api/getList.js";
import { updateItem } from "../api/updateItem.js";
import AddItemForm from "../components/AddItemForm.jsx";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import ItemRow from "../components/ItemRow.jsx";

// Items with a position first (by position), then by ID (= creation time), like the API.
function byOrder(a, b) {
  const pa = a.position ?? Infinity;
  const pb = b.position ?? Infinity;
  if (pa !== pb) return pa - pb;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

let tempCounter = 0;

// ST-18 adds live updates from other people.
export default function ListPage() {
  const { id: listId } = useParams();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | failed
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getList(listId);
      setList(data.list);
      setItems(data.items);
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

  const replaceItem = (id, next) => setItems((current) => current.map((i) => (i.id === id ? next : i)));

  // ---------- optimistic changes: apply now, roll back with a message on failure ----------

  async function addItem(fields) {
    setError("");
    const temp = { id: `tmp-${++tempCounter}`, done: false, qty: null, position: null, ...fields };
    setItems((current) => [...current, temp]);
    try {
      replaceItem(temp.id, await createItem(listId, fields));
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
      <AppBar title={list?.name ?? "List"} back="/" />

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
            {open.map((item) => <ItemRow key={item.id} item={item} {...rowProps} />)}
          </ul>
          {done.length > 0 && (
            <>
              <div className="done-divider">Done · {done.length}</div>
              <ul className="items">
                {done.map((item) => <ItemRow key={item.id} item={item} {...rowProps} />)}
              </ul>
            </>
          )}
          <div className="spacer" />
          <AddItemForm onAdd={addItem} />
        </>
      )}
    </main>
  );
}
