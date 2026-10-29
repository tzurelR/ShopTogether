import { useState } from "react";

import { createInvite } from "../api/createInvite.js";
import { deleteInvite } from "../api/deleteInvite.js";
import { removeMember } from "../api/removeMember.js";
import { timeLeft } from "../lib/timeLeft.js";
import Alert from "./Alert.jsx";
import CopyLink from "./CopyLink.jsx";
import PersonRow from "./PersonRow.jsx";
import TextField from "./TextField.jsx";
import { t } from "../i18n/i18n.js";

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
      setError(err.status === 409 ? t("share.alreadyMember", { email: email.trim().toLowerCase() }) : err.message);
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
            label={t("share.inviteLabel")}
            dir="ltr"
            type="email"
            placeholder="name@example.com"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Alert>{error}</Alert>
          <button className="btn" type="submit" disabled={busy || !email.trim()}>
            {busy ? t("share.inviting") : t("share.invite")}
          </button>
        </form>
      )}

      {sent && (
        <div className="stack">
          <Alert kind="info">
            {t(sent.emailSent ? "share.emailed" : "share.notEmailed", { email: sent.email })}
          </Alert>
          <CopyLink link={sent.link} />
        </div>
      )}

      <span className="share-section-title">{t("share.people", { count: members.length })}</span>
      <ul className="people">
        {members.map((m) => {
          const me = m.sub === mySub;
          let action = null;
          if (isOwner && !me && m.role !== "owner") {
            action = {
              label: t("share.remove"),
              confirm: t("share.removeConfirm", { email: m.email }),
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
              title={me ? t("share.you") : undefined}
              tag={m.role === "owner" ? t("share.owner") : t("share.editor")}
              action={action}
            />
          );
        })}
      </ul>

      {isOwner && pending.length > 0 && (
        <>
          <span className="share-section-title">{t("share.pending", { count: pending.length })}</span>
          <ul className="people">
            {pending.map((inv) => (
              <PersonRow
                key={inv.email}
                email={inv.email}
                title={inv.email}
                detail={t("share.invitedExpires", { time: timeLeft(inv.expiresAt) })}
                tag={t("share.pendingTag")}
                tagKind="wait"
                action={{
                  label: t("share.cancelInvite"),
                  confirm: t("share.cancelInviteConfirm", { email: inv.email }),
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
            title={t("share.leaveTitle")}
            detail={t("share.leaveDetail")}
            action={{
              label: t("share.leave"),
              confirm: t("share.leaveConfirm", { name: list.name }),
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
