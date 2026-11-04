import { useState } from "react";

import { createInvite } from "../api/createInvite.js";
import { deleteInvite } from "../api/deleteInvite.js";
import { removeMember } from "../api/removeMember.js";
import { t } from "../i18n/i18n.js";
import { avatarColor, initial } from "../lib/avatarColor.js";
import { displayName } from "../lib/displayName.js";
import { timeLeft } from "../lib/timeLeft.js";
import Alert from "./Alert.jsx";
import CopyLink from "./CopyLink.jsx";
import Icon from "./Icon.jsx";
import PersonRow from "./PersonRow.jsx";
import "./PersonRow.css";

/**
 * People, pending invites and the invite form for one list.
 * The owner invites, cancels invites and removes people; everyone else can leave.
 */
export default function ShareSheet({ list, members, invites, mySub, present = [], onInvited, onInviteCancelled, onMemberRemoved, onLeft }) {
  const isOwner = list.role === "owner";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null); // { email, link, emailSent }
  const here = new Set(present.map((p) => p.sub));

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
  const avatar = (person, me) => (
    <span className={`avatar person-avatar${me ? " person-avatar-me" : ""}`} style={me ? undefined : { "--avatar": avatarColor(person.email) }} aria-hidden="true">
      {initial(person.email)}
      {!me && here.has(person.sub) && <span className="person-online-dot" />}
    </span>
  );

  return (
    <div className="stack" style={{ gap: 20 }}>
      {isOwner && (
        <form className="field" onSubmit={invite}>
          <label htmlFor="invite-email">{t("share.inviteLabel")}</label>
          <div className="invite-row">
            <input
              id="invite-email"
              className="input"
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={busy || !email.trim()}>
              {busy ? t("share.inviting") : t("share.invite")}
            </button>
          </div>
          <Alert>{error}</Alert>
        </form>
      )}

      {sent && (
        <CopyLink
          link={sent.link}
          title={t("share.linkTitle")}
          subtitle={t(sent.emailSent ? "share.emailed" : "share.notEmailed", { email: sent.email })}
        />
      )}

      <div className="stack" style={{ gap: 4 }}>
        <span className="share-section-title">{t("share.people", { count: members.length })}</span>
        <ul className="people">
          {members.map((m) => {
            const me = m.sub === mySub;
            const online = !me && here.has(m.sub);
            const name = me ? t("share.you") : displayName(m.email);
            let action = null;
            if (isOwner && !me && m.role !== "owner") {
              action = {
                kind: "menu",
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
                avatar={avatar(m, me)}
                title={name}
                detail={online ? t("share.hereNow") : m.role === "owner" ? t("share.owner") : t("share.member")}
                tone={online ? "online" : undefined}
                action={action}
                menuLabel={t("lists.options", { name })}
              />
            );
          })}
          {isOwner &&
            pending.map((inv) => (
              <PersonRow
                key={inv.email}
                avatar={<span className="person-avatar-pending" aria-hidden="true"><Icon name="mail" size={16} /></span>}
                title={inv.email}
                detail={t("share.inviteWaiting")}
                tone="pending"
                action={{
                  kind: "text",
                  label: t("common.cancel"),
                  confirm: t("share.cancelInviteConfirm", { email: inv.email }),
                  run: async () => {
                    await deleteInvite(list.id, inv.email);
                    onInviteCancelled(inv.email);
                  },
                }}
              />
            ))}
        </ul>
      </div>

      {!isOwner && (
        <ul className="people">
          <PersonRow
            avatar={<span className="person-avatar-pending" aria-hidden="true"><Icon name="close" size={14} /></span>}
            title={t("share.leaveTitle")}
            detail={t("share.leaveDetail")}
            action={{
              kind: "text",
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
