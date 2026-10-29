import { Link } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import { t } from "../i18n/i18n.js";

export default function NotFoundPage() {
  return (
    <AuthLayout title={t("notFound.title")} subtitle={t("notFound.body")} footer={<Link to="/">{t("invite.goToLists")}</Link>} />
  );
}
