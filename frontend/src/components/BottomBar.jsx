import "./BottomBar.css";

// Toolbar pinned to the bottom of the screen (like "New Reminder" / "Add List").
export default function BottomBar({ left, right }) {
  return (
    <div className="toolbar">
      <div className="toolbar-inner">
        <div>{left}</div>
        <div>{right}</div>
      </div>
    </div>
  );
}
