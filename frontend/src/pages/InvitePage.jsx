import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { acceptInvite } from "../api/acceptInvite.js";
import { getInvite } from "../api/getInvite.js";
import { useAuth } from "../auth/useAuth.js";
import AuthLayout from "../components/AuthLayout.jsx";

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
      try {
        const info = await getInvite(token);
        setInvite(info);
        if (!info.alreadyMember) await acceptInvite(token);
        navigate(`/lists/${info.listId}`, { replace: true });
      } catch (err) {
        if (err.status === 403) {
          setProblem({ kind: "wrong-account", title: "This invite is for someone else", message: err.message });
        } else if (err.status === 404) {
          setProblem({ title: "This invite can't be used", message: err.message });
        } else {
          setProblem({ title: "Couldn't open the invite", message: err.message });
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
      <AuthLayout title={problem.title} subtitle={problem.message} footer={<Link to="/">Go to My lists</Link>}>
        {problem.kind === "wrong-account" && (
          <div className="stack">
            <p className="muted small">You're logged in as {user?.email}.</p>
            <button className="btn" type="button" onClick={switchAccount}>
              Log out and switch account
            </button>
          </div>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={invite ? `Joining “${invite.listName}”…` : "Opening your invite…"}
      subtitle={invite?.invitedByEmail ? `Shared by ${invite.invitedByEmail}` : undefined}
    />
  );
}
