import { Link } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";

export default function NotFoundPage() {
  return (
    <AuthLayout title="Page not found" subtitle="That link doesn't go anywhere." footer={<Link to="/">Go to My lists</Link>} />
  );
}
