import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../api/request.js";
import { createCategory } from "../api/createCategory.js";
import { createItem } from "../api/createItem.js";
import { deleteCategory } from "../api/deleteCategory.js";
import { deleteItem } from "../api/deleteItem.js";
import { deleteItems } from "../api/deleteItems.js";
import { getList } from "../api/getList.js";
import { updateCategory } from "../api/updateCategory.js";
import { updateItem } from "../api/updateItem.js";
import { useAuth } from "../auth/useAuth.js";
import Alert from "../components/Alert.jsx";
import AppBar from "../components/AppBar.jsx";
import CategoryHeader from "../components/CategoryHeader.jsx";
import Composer from "../components/Composer.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import Icon from "../components/Icon.jsx";
import ItemRow from "../components/ItemRow.jsx";
import ListMenu from "../components/ListMenu.jsx";
import ListNameForm from "../components/ListNameForm.jsx";
import LivePill from "../components/LivePill.jsx";
import ShareSheet from "../components/ShareSheet.jsx";
import Sheet from "../components/Sheet.jsx";
import Toast from "../components/Toast.jsx";
import { displayName } from "../lib/displayName.js";
import { haptic } from "../lib/haptic.js";
import { listColor } from "../lib/listColor.js";
import { byOrder, dropPosition, groupOf } from "../lib/ordering.js";
import { describeEvent } from "../realtime/describeEvent.js";
import { useListSocket } from "../realtime/useListSocket.js";
import { t } from "../i18n/i18n.js";

let tempCounter = 0;

const FLASH_MS = 3000; // how long "Dana added · just now" stays on a row
// A checked item stays in place this long before it moves to Completed (like Reminders).
const LINGER_MS = 1200;
// While dragging near the top or bottom edge, the page scrolls by this much per frame.
const EDGE_PX = 90;
const SCROLL_STEP = 12;

export default function ListPage() {
  const { id: listId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(null); // null, or { group: "" | categoryId } for the new-item row
  const [categorySheet, setCategorySheet] = useState(null); // { kind: "create" | "rename" | "delete", category }
  const [clearing, setClearing] = useState(null); // "all" | "completed" while the confirm sheet is open
  const [drag, setDrag] = useState(null); // { id, offset, target: { group, index }, lineTop }
  const [showCompleted, setShowCompleted] = useState(false);
  const [lingering, setLingering] = useState({}); // itemId -> true right after you check it
  const [flashing, setFlashing] = useState({}); // itemId -> note ("Dana added · just now") while highlighted
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
      setCategories(data.categories || []);
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

  const flash = useCallback((id, note = "") => {
    setFlashing((current) => ({ ...current, [id]: note || true }));
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
      const message = mine
        ? t("lists.deleted", { name: event.list.name })
        : t("lists.deletedBy", { name: event.list.name, who: displayName(nameOf(event.by)) });
      navigate("/", { replace: true, state: { message } });
      return;
    }
    if (event.type === "member.removed" && event.member.sub === user?.sub) {
      const message = t(mine ? "lists.youLeft" : "lists.youWereRemoved", { name: list?.name });
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
      case "items.deleted": {
        const gone = new Set(event.itemIds || []);
        setItems((current) => current.filter((i) => !gone.has(i.id)));
        break;
      }
      case "list.updated":
        setList((current) => ({ ...current, name: event.list.name }));
        break;
      case "category.created":
      case "category.updated":
        setCategories((current) => [...current.filter((c) => c.id !== event.category.id), event.category]);
        break;
      case "category.deleted": {
        const moved = new Set(event.movedItemIds || []);
        setCategories((current) => current.filter((c) => c.id !== event.category.id));
        setItems((current) => current.map((i) => (moved.has(i.id) || i.categoryId === event.category.id ? { ...i, categoryId: null } : i)));
        break;
      }
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
    const whoName = displayName(nameOf(event.by));
    if (event.type === "item.created") flash(event.item.id, t("item.noteAdded", { who: whoName }));
    if (event.type === "item.updated") {
      const checked = previousItem && !previousItem.done && event.item.done;
      flash(event.item.id, t(checked ? "item.noteChecked" : "item.noteEdited", { who: whoName }));
    }
    // Someone else checked it off: leave it in place briefly so you see it happen.
    if (event.type === "item.updated" && previousItem && !previousItem.done && event.item.done) linger(event.item.id);
    const text = describeEvent(event, { nameOf, previousItem });
    if (text) setToast({ text, from: nameOf(event.by) }); // avatar only when we know who it was
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
      setError(t("list.couldntAdd", { text: fields.text, reason: err.message }));
    }
  }

  async function changeItem(item, changes) {
    setError("");
    const optimistic = { ...item, ...changes };
    if (changes.qty === "") optimistic.qty = null;
    if (changes.categoryId === "") optimistic.categoryId = null;
    replaceItem(item.id, optimistic);
    try {
      replaceItem(item.id, await updateItem(listId, item.id, changes));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setItems((current) => current.filter((i) => i.id !== item.id));
      } else {
        replaceItem(item.id, item);
      }
      setError(t("list.couldntSave", { text: item.text, reason: err.message }));
    }
  }

  async function removeItem(item) {
    haptic(15);
    setError("");
    const index = items.findIndex((i) => i.id === item.id);
    setItems((current) => current.filter((i) => i.id !== item.id));
    setToast({
      text: t("list.removed", { text: item.text }),
      action: { label: t("list.undo"), onClick: () => restoreItem(item) },
    });
    try {
      await deleteItem(listId, item.id);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        setToast("");
        setItems((current) => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, item);
          return next;
        });
        setError(t("list.couldntRemove", { text: item.text, reason: err.message }));
      }
    }
  }

  // Undo a delete: add the item back with the same name, amount, check state and place.
  function restoreItem(item) {
    const fields = { text: item.text, done: !!item.done };
    if (item.qty) fields.qty = item.qty;
    if (item.position != null) fields.position = item.position;
    if (item.categoryId && categories.some((c) => c.id === item.categoryId)) fields.categoryId = item.categoryId;
    addItem(fields);
  }

  // ---------- delete many (⋯ menu) ----------

  async function handleClear() {
    const scope = clearing;
    const before = itemsRef.current;
    // Gone right away; put back if the server says no.
    setItems((current) => (scope === "completed" ? current.filter((i) => !i.done) : []));
    setClearing(null);
    haptic(15);
    try {
      const deleted = await deleteItems(listId, scope);
      if (deleted.length) {
        setToast({
          text: t("list.deletedMany", { count: deleted.length }),
          action: { label: t("list.undo"), onClick: () => deleted.forEach(restoreItem) },
        });
      }
    } catch (err) {
      setItems(before);
      setError(t("list.couldntDeleteMany", { reason: err.message }));
    }
  }

  // ---------- categories ----------

  async function handleCreateCategory(name) {
    const category = await createCategory(listId, name);
    setCategories((current) => [...current.filter((c) => c.id !== category.id), category]);
    setCategorySheet(null);
  }

  async function handleRenameCategory(name) {
    const category = await updateCategory(listId, categorySheet.category.id, { name });
    setCategories((current) => current.map((c) => (c.id === category.id ? category : c)));
    setCategorySheet(null);
  }

  async function handleDeleteCategory() {
    const { id } = categorySheet.category;
    await deleteCategory(listId, id);
    setCategories((current) => current.filter((c) => c.id !== id));
    setItems((current) => current.map((i) => (i.categoryId === id ? { ...i, categoryId: null } : i)));
    setCategorySheet(null);
  }

  // ---------- drag & drop (the ≡ handle) ----------

  const dropRef = useRef(null);
  const dragRef = useRef(null); // { item, startY, startScroll, lastY, frame }

  /** Which group and slot the pointer is over, plus where to draw the drop line. */
  function dropTarget(clientY, draggedId) {
    const wrap = dropRef.current;
    if (!wrap) return null;
    let target = null;
    let lineY = null;
    for (const section of wrap.querySelectorAll("[data-group]")) {
      const group = section.dataset.group;
      const sectionTop = section.getBoundingClientRect().top;
      if (target && clientY < sectionTop) break;
      const header = section.querySelector("[data-category-header]");
      target = { group, index: 0 };
      lineY = header ? header.getBoundingClientRect().bottom : sectionTop;
      const rows = [...section.querySelectorAll("[data-item-id]")].filter((r) => r.dataset.itemId !== draggedId);
      rows.forEach((row, i) => {
        const rect = row.getBoundingClientRect();
        if (clientY >= rect.top + rect.height / 2) {
          target = { group, index: i + 1 };
          lineY = rect.bottom;
        }
      });
    }
    if (!target) return null;
    return { target, lineTop: lineY - wrap.getBoundingClientRect().top };
  }

  function refreshDrag() {
    const d = dragRef.current;
    if (!d) return;
    const offset = d.lastY + window.scrollY - (d.startY + d.startScroll);
    const found = dropTarget(d.lastY, d.item.id);
    setDrag({ id: d.item.id, offset, target: found?.target ?? null, lineTop: found?.lineTop ?? null });
  }

  function startDrag(item, event) {
    haptic(8);
    dragRef.current = { item, startY: event.clientY, startScroll: window.scrollY, lastY: event.clientY, frame: 0 };
    const tick = () => {
      const d = dragRef.current;
      if (!d) return;
      // Scroll while the finger is near the top or bottom edge, so long lists work.
      if (d.lastY < EDGE_PX) window.scrollBy(0, -SCROLL_STEP);
      else if (d.lastY > window.innerHeight - EDGE_PX - 40) window.scrollBy(0, SCROLL_STEP);
      refreshDrag();
      d.frame = requestAnimationFrame(tick);
    };
    dragRef.current.frame = requestAnimationFrame(tick);
    refreshDrag();
  }

  function moveDrag(event) {
    if (!dragRef.current) return;
    dragRef.current.lastY = event.clientY;
    refreshDrag();
  }

  function endDrag(event, { cancelled = false } = {}) {
    const d = dragRef.current;
    if (!d) return;
    cancelAnimationFrame(d.frame);
    dragRef.current = null;
    const found = cancelled ? null : dropTarget(event.clientY ?? d.lastY, d.item.id);
    setDrag(null);
    if (found) moveItem(d.item, found.target);
  }

  /** Put `item` into `group` before the item now at `index` (siblings exclude it). */
  function moveItem(item, { group, index }) {
    const ids = new Set(categories.map((c) => c.id));
    const current = itemsRef.current.find((i) => i.id === item.id) || item;
    const inGroup = itemsRef.current.filter((i) => !i.done && groupOf(i, ids) === group).sort(byOrder);
    const siblings = inGroup.filter((i) => i.id !== current.id);
    const from = inGroup.findIndex((i) => i.id === current.id);
    if (from !== -1 && from === index) return; // dropped where it already was
    haptic(12);
    const { position, renumber } = dropPosition(siblings, index);
    renumber.forEach(({ item: sibling, position: p }) => changeItem(sibling, { position: p }));
    const changes = { position };
    if (groupOf(current, ids) !== group) changes.categoryId = group; // "" = out of its category
    changeItem(current, changes);
  }

  function toggle(item) {
    haptic();
    if (!item.done) linger(item.id);
    changeItem(item, { done: !item.done });
  }

  if (status === "missing") {
    return (
      <main className="page">
        <AppBar title={t("list.fallbackTitle")} back="/" backLabel={t("list.back")} />
        <div className="card stack center">
          <p><b>{t("list.notFoundTitle")}</b></p>
          <p className="muted small">{t("list.notFoundBody")}</p>
          <Link to="/">{t("list.backToLists")}</Link>
        </div>
      </main>
    );
  }

  const open = items.filter((i) => !i.done || lingering[i.id]).sort(byOrder);
  const done = items.filter((i) => i.done && !lingering[i.id]).sort(byOrder);
  const sortedCategories = [...categories].sort(byOrder);
  const categoryIds = new Set(categories.map((c) => c.id));
  const openIn = (group) => open.filter((i) => groupOf(i, categoryIds) === group);
  const uncategorized = openIn("");
  const rowProps = { onToggle: toggle, onEdit: changeItem, onDelete: removeItem };
  const dragProps = { onDragStart: startDrag, onDragMove: moveDrag, onDragEnd: endDrag };
  const startAdding = (group = "") => setAdding({ group });
  const renderRow = (item) => (
    <ItemRow
      key={item.id}
      item={item}
      flash={!!flashing[item.id]}
      note={typeof flashing[item.id] === "string" ? flashing[item.id] : ""}
      lifted={drag?.id === item.id ? drag.offset : null}
      {...rowProps}
      {...dragProps}
    />
  );
  const groupClass = (group) => `items${adding?.group === group ? " items-target" : ""}`;

  const left = items.filter((i) => !i.done).length;
  const doneCount = items.length - left;
  const showEmpty = open.length === 0 && !adding && categories.length === 0;
  return (
    // The list's color tints the title, checks and buttons, like Reminders.
    <main className="page" style={{ "--accent": listColor(listId) }}>
      <AppBar
        title={list?.name ?? ""}
        subtitle={status === "ready" ? (items.length ? t("list.leftDone", { left, done: doneCount }) : t("list.noItems")) : null}
        progress={status === "ready" && items.length ? (doneCount / items.length) * 100 : null}
        back="/"
        backLabel={t("list.back")}
        meta={status === "ready" ? <LivePill status={liveStatus} present={present} mySub={user?.sub} /> : null}
      >
        {status === "ready" && (
          <button className="nav-round" type="button" aria-label={t("list.share")} title={t("list.share")} onClick={() => setSharing(true)}>
            <Icon name="share" size={20} />
          </button>
        )}
        {status === "ready" && (
          <ListMenu
            totalCount={items.length}
            doneCount={items.filter((i) => i.done).length}
            onDeleteCompleted={() => setClearing("completed")}
            onDeleteAll={() => setClearing("all")}
          />
        )}
      </AppBar>

      {error && (
        <Alert>
          {error}
          {status === "failed" && (
            <>
              {" "}
              <button className="btn-link" type="button" onClick={load}>{t("common.tryAgain")}</button>
            </>
          )}
        </Alert>
      )}

      {status === "loading" && <p className="muted small">{t("list.loading")}</p>}

      {status === "ready" && (
        <>
          {showEmpty && (
            <div className="empty">
              <div className="empty-icon" aria-hidden="true"><Icon name={done.length ? "check" : "cart"} size={26} /></div>
              <p className="empty-title">{done.length ? t("list.allDone") : t("list.emptyTitle")}</p>
              <p className="muted">{done.length ? t("list.allDoneBody") : t("list.emptyBody")}</p>
            </div>
          )}

          {!showEmpty && (
            <div ref={dropRef} className={`drop-wrap${drag ? " dragging-list" : ""}`}>
              {/* Items without a category come first, like Reminders. */}
              {(uncategorized.length > 0 || (drag && categories.length > 0)) && (
                <section data-group="">
                  {uncategorized.length === 0 && drag && (
                    <div className="drop-zone">{t("category.dropHere")}</div>
                  )}
                  {uncategorized.length > 0 && <ul className={groupClass("")}>{uncategorized.map(renderRow)}</ul>}
                </section>
              )}

              {sortedCategories.map((category) => {
                const rows = openIn(category.id);
                return (
                  <section key={category.id} data-group={category.id} className="category-section">
                    <CategoryHeader
                      category={category}
                      count={rows.filter((i) => !i.done).length}
                      onAddItem={(c) => startAdding(c.id)}
                      onRename={(c) => setCategorySheet({ kind: "rename", category: c })}
                      onDelete={(c) => setCategorySheet({ kind: "delete", category: c })}
                    />
                    {rows.length > 0 && <ul className={groupClass(category.id)}>{rows.map(renderRow)}</ul>}
                  </section>
                );
              })}

              {drag?.lineTop != null && <div className="drop-line" style={{ top: drag.lineTop }} aria-hidden="true" />}
            </div>
          )}

          {done.length > 0 && (
            <>
              <button type="button" className="completed-row" aria-expanded={showCompleted} onClick={() => setShowCompleted((v) => !v)}>
                <span className="completed-count">{t("list.completed", { count: done.length })}</span>
                <span className="completed-toggle">{showCompleted ? t("list.hide") : t("list.show")}</span>
              </button>
              {showCompleted && (
                <ul className="items">
                  {done.map((item) => <ItemRow key={item.id} item={item} flash={!!flashing[item.id]} note={typeof flashing[item.id] === "string" ? flashing[item.id] : ""} {...rowProps} />)}
                </ul>
              )}
            </>
          )}

          {/* Tapping the empty space under the list starts a new item, like Reminders. */}
          <button type="button" className="tap-to-add" aria-hidden="true" tabIndex={-1} onClick={() => startAdding("")} />

          {adding ? (
            <Composer
              categories={sortedCategories}
              group={adding.group}
              onGroupChange={(group) => setAdding({ group })}
              onAdd={(fields, group) => addItem(group ? { ...fields, categoryId: group } : fields)}
              onClose={() => setAdding(null)}
            />
          ) : (
            <div className="addbar">
              <button className="addbar-item" type="button" onClick={() => startAdding("")}>
                <span className="addbar-plus" aria-hidden="true"><Icon name="plus" size={18} /></span>
                {t("list.addAnItem")}
              </button>
              <button
                className="addbar-category"
                type="button"
                aria-label={t("category.add")}
                title={t("category.add")}
                onClick={() => setCategorySheet({ kind: "create" })}
              >
                <Icon name="folderPlus" size={22} />
              </button>
            </div>
          )}
        </>
      )}
      <Toast message={toast} onDone={clearToast} />

      <Sheet
        open={!!clearing}
        title={clearing === "completed" ? t("list.deleteCompletedTitle") : t("list.deleteAllTitle")}
        onClose={() => setClearing(null)}
      >
        <ConfirmDelete
          message={
            clearing === "completed"
              ? t("list.deleteCompletedBody", { count: items.filter((i) => i.done).length })
              : t("list.deleteAllBody", { count: items.length })
          }
          confirmLabel={clearing === "completed" ? t("list.deleteCompleted", { count: items.filter((i) => i.done).length }) : t("list.deleteAll")}
          onConfirm={handleClear}
          onCancel={() => setClearing(null)}
        />
      </Sheet>

      <Sheet open={categorySheet?.kind === "create"} title={t("category.new")} onClose={() => setCategorySheet(null)}>
        <ListNameForm
          label={t("category.nameLabel")}
          placeholder={t("category.namePlaceholder")}
          maxLength={60}
          submitLabel={t("category.create")}
          busyLabel={t("category.creating")}
          onSubmit={handleCreateCategory}
          onCancel={() => setCategorySheet(null)}
        />
      </Sheet>
      <Sheet open={categorySheet?.kind === "rename"} title={t("category.rename")} onClose={() => setCategorySheet(null)}>
        <ListNameForm
          initialName={categorySheet?.category?.name}
          label={t("category.nameLabel")}
          maxLength={60}
          submitLabel={t("common.save")}
          busyLabel={t("common.saving")}
          onSubmit={handleRenameCategory}
          onCancel={() => setCategorySheet(null)}
        />
      </Sheet>
      <Sheet
        open={categorySheet?.kind === "delete"}
        title={t("category.deleteTitle", { name: categorySheet?.category?.name ?? "" })}
        onClose={() => setCategorySheet(null)}
      >
        <ConfirmDelete
          message={t("category.deleteBody")}
          confirmLabel={t("category.delete")}
          onConfirm={handleDeleteCategory}
          onCancel={() => setCategorySheet(null)}
        />
      </Sheet>

      <Sheet open={sharing && !!list} title={t("share.title")} subtitle={t("share.subtitle")} onClose={() => setSharing(false)}>
        {list && (
          <ShareSheet
            list={list}
            members={members}
            invites={invites}
            mySub={user?.sub}
            present={present}
            onInvited={(invite) => setInvites((current) => [...current.filter((i) => i.email !== invite.email), invite])}
            onInviteCancelled={(email) => setInvites((current) => current.filter((i) => i.email !== email))}
            onMemberRemoved={(sub) => setMembers((current) => current.filter((m) => m.sub !== sub))}
            onLeft={() => navigate("/", { replace: true, state: { message: t("lists.youLeft", { name: list.name }) } })}
          />
        )}
      </Sheet>
    </main>
  );
}
