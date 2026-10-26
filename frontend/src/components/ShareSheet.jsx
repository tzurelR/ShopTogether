import { useState } from "react";

import { createInvite } from "../api/createInvite.js";
import { deleteInvite } from "../api/deleteInvite.js";
import { removeMember } from "../api/removeMember.js";
import { timeLeft } from "../lib/timeLeft.js";
import Alert from "./Alert.jsx";
import CopyLink from "./CopyLink.jsx";
import PersonRow from "./PersonRow.jsx";
import TextField from "./TextField.jsx";

/**
 * Members, pending invites and the invite form for one list.
 * The owner invites, cancels invites and removes people; everyone else can leave.
 */
export default function ShareSheet({ list, members, invites, mySub, onInvited, onInviteCancelled, onMemberRemoved, onLeft }) {
  const isOwner = list.role === "owner";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null); // { email, link, emailSent }

  async function invite(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await createInvite(list.id, email.trim());
      onInvited(result.invite);
      setSent({ email: result.invite.email, link: result.link, emailSent: result.emailSent });
      setEmail("");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  const pending = invites.filter((i) => timeLeft(i.expiresAt));

  return (
    <div className="stack">
      {isOwner && (
        <form className="stack" onSubmit={invite}>
          <TextField
            id="invite-email"
            label="Invite by email"
            type="email"
            placeholder="name@example.com"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Alert>{error}</Alert>
          <button className="btn" type="submit" disabled={busy || !email.trim()}>
            {busy ? "Inviting…" : "Invite"}
          </button>
        </form>
      )}

      {sent && (
        <div className="stack">
          <Alert kind="info">
            {sent.emailSent
              ? `We emailed an invite to ${sent.email}. You can also send them this link:`
              : `We couldn't email ${sent.email}. Send them this link yourself:`}
          </Alert>
          <CopyLink link={sent.link} />
        </div>
      )}

      <span className="share-section-title">People · {members.length}</span>
      <ul className="people">
        {members.map((m) => {
          const me = m.sub === mySub;
          let action = null;
          if (isOwner && !me && m.role !== "owner") {
            action = {
              label: "Remove",
              confirm: `Remove ${m.email}? They'll lose access right away.`,
              run: async () => {
                await removeMember(list.id, m.sub);
                onMemberRemoved(m.sub);
              },
            };
          }
          return (
            <PersonRow
              key={m.sub}
              email={m.email}
              title={me ? "You" : undefined}
              tag={m.role === "owner" ? "Owner" : "Editor"}
              action={action}
            />
          );
        })}
      </ul>

      {isOwner && pending.length > 0 && (
        <>
          <span className="share-section-title">Pending · {pending.length}</span>
          <ul className="people">
            {pending.map((inv) => (
              <PersonRow
                key={inv.email}
                email={inv.email}
                title={inv.email}
                detail={`Invited · expires in ${timeLeft(inv.expiresAt)}`}
                tag="Pending"
                tagKind="wait"
                action={{
                  label: "Cancel invite",
                  confirm: `Cancel the invite to ${inv.email}? The link stops working.`,
                  run: async () => {
                    await deleteInvite(list.id, inv.email);
                    onInviteCancelled(inv.email);
                  },
                }}
              />
            ))}
          </ul>
        </>
      )}

      {!isOwner && (
        <ul className="people">
          <PersonRow
            email={members.find((m) => m.sub === mySub)?.email}
            title="Leave this list"
            detail="You'll stop seeing it. The owner can invite you again."
            action={{
              label: "Leave",
              confirm: `Leave “${list.name}”?`,
              run: async () => {
                await removeMember(list.id, mySub);
                onLeft();
              },
            }}
          />
        </ul>
      )}
    </div>
  );
}
