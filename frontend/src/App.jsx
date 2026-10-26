import { Route, Routes } from "react-router-dom";

import ConfirmPage from "./pages/ConfirmPage.jsx";
import ForgotPage from "./pages/ForgotPage.jsx";
import InvitePage from "./pages/InvitePage.jsx";
import ListPage from "./pages/ListPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyListsPage from "./pages/MyListsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

// ST-15 wraps "/", "/lists/:id" and "/invite/:token" in a login guard.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="/" element={<MyListsPage />} />
      <Route path="/lists/:id" element={<ListPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
