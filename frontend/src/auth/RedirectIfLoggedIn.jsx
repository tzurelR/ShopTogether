import { Navigate, useSearchParams } from "react-router-dom";

import Loading from "../components/Loading.jsx";
import { safeNext } from "./safeNext.js";
import { useAuth } from "./useAuth.js";

// Login and sign-up pages skip straight to the app when a session already exists.
export default function RedirectIfLoggedIn({ children }) {
  const { status } = useAuth();
  const [params] = useSearchParams();

  if (status === "loading") return <Loading />;
  if (status === "in") return <Navigate to={safeNext(params.get("next"))} replace />;
  return children;
}
