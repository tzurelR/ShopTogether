import { useParams } from "react-router-dom";

import AppBar from "../components/AppBar.jsx";

// ST-17 loads the items; ST-18 adds live updates.
export default function ListPage() {
  const { id } = useParams();
  return (
    <main className="page">
      <AppBar title="List" back="/" />
      <p className="muted small">List {id}</p>
    </main>
  );
}
