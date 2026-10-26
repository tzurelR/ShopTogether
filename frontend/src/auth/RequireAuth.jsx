import { Navigate, useLocation } from "react-router-dom";

import Loading from "../components/Loading.jsx";
import { useAuth } from "./useAuth.js";

// Logged-out visitors go to /login?next=<where they were going>.
export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Loading />;
  if (status === "out") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
