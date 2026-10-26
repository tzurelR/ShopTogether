import { createContext, useEffect, useMemo, useState } from "react";

import { currentUser, logIn, logOut, onUserChange, restoreSession } from "./session.js";

export const AuthContext = createContext(null);

// status: "loading" while the stored session is restored, then "in" or "out".
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(currentUser());
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const unsubscribe = onUserChange(setUser);
    restoreSession().finally(() => setRestored(true));
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status: !restored ? "loading" : user ? "in" : "out",
      logIn,
      logOut,
    }),
    [user, restored],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
