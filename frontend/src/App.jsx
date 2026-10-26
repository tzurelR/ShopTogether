import { Route, Routes } from "react-router-dom";

import RedirectIfLoggedIn from "./auth/RedirectIfLoggedIn.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import ConfirmPage from "./pages/ConfirmPage.jsx";
import ForgotPage from "./pages/ForgotPage.jsx";
import InvitePage from "./pages/InvitePage.jsx";
import ListPage from "./pages/ListPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyListsPage from "./pages/MyListsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

const guest = (page) => <RedirectIfLoggedIn>{page}</RedirectIfLoggedIn>;
const member = (page) => <RequireAuth>{page}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={guest(<LoginPage />)} />
      <Route path="/signup" element={guest(<SignupPage />)} />
      <Route path="/confirm" element={guest(<ConfirmPage />)} />
      <Route path="/forgot" element={guest(<ForgotPage />)} />
      <Route path="/" element={member(<MyListsPage />)} />
      <Route path="/lists/:id" element={member(<ListPage />)} />
      <Route path="/invite/:token" element={member(<InvitePage />)} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
