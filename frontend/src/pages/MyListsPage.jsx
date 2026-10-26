import AccountMenu from "../components/AccountMenu.jsx";
import AppBar from "../components/AppBar.jsx";

// ST-16 loads the lists; until then this shows the empty state.
export default function MyListsPage() {
  return (
    <main className="page">
      <AppBar title="My lists">
        <AccountMenu />
      </AppBar>
      <div className="card stack center">
        <p><b>No lists yet.</b></p>
        <p className="muted small">Press + to make your first one.</p>
      </div>
      <button className="btn fab" type="button" aria-label="New list">+</button>
    </main>
  );
}
