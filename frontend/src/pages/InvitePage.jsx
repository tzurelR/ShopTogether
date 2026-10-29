import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { acceptInvite } from "../api/acceptInvite.js";
import { getInvite } from "../api/getInvite.js";
import { useAuth } from "../auth/useAuth.js";
import AuthLayout from "../components/AuthLayout.jsx";
import { t } from "../i18n/i18n.js";

/**
 * /invite/:token — only reached logged in (the guard sends others through login or
 * sign up and back here). Joins the list straight away and opens it.
 */
export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const [invite, setInvite] = useState(null);
  const [problem, setProblem] = useState(null); // { title, message, kind }
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev; join once
    started.current = true;
    (async () => {
      let info = null;
      try {
        info = await getInvite(token);
        setInvite(info);
        if (!info.alreadyMember) await acceptInvite(token);
        navigate(`/lists/${info.listId}`, { replace: true });
      } catch (err) {
        if (err.status === 403) {
          const message = info?.email ? t("invite.wrongBody", { email: info.email }) : err.message;
          setProblem({ kind: "wrong-account", title: t("invite.wrongTitle"), message });
        } else if (err.status === 404) {
          setProblem({ title: t("invite.goneTitle"), message: t("invite.goneBody") });
        } else {
          setProblem({ title: t("invite.failedTitle"), message: err.message });
        }
      }
    })();
  }, [token, navigate]);

  async function switchAccount() {
    await logOut();
    navigate(`/login?next=${encodeURIComponent(`/invite/${token}`)}`, { replace: true });
  }

  if (problem) {
    return (
      <AuthLayout title={problem.title} subtitle={problem.message} footer={<Link to="/">{t("invite.goToLists")}</Link>}>
        {problem.kind === "wrong-account" && (
          <div className="stack">
            <p className="muted small">{t("invite.loggedInAs", { email: user?.email })}</p>
            <button className="btn" type="button" onClick={switchAccount}>
              {t("invite.switch")}
            </button>
          </div>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={invite ? t("invite.joining", { name: invite.listName }) : t("invite.opening")}
      subtitle={invite?.invitedByEmail ? t("invite.sharedBy", { email: invite.invitedByEmail }) : undefined}
    />
  );
}
