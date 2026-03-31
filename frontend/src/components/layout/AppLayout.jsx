export default function AppLayout({ sidebar, main, showChat }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Sidebar
          Desktop (sm+): always visible, fixed width
          Mobile: full screen when no chat open, hidden otherwise */}
      <aside
        className={`flex-shrink-0 flex flex-col ${showChat ? "hidden sm:flex" : "flex w-full sm:w-72"}`}
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {sidebar}
      </aside>

      {/* Chat pane
          Desktop: always visible, takes remaining space
          Mobile: full screen when chat open, hidden otherwise */}
      <main
        className={`flex-col overflow-hidden ${showChat ? "flex flex-1" : "hidden sm:flex sm:flex-1"}`}
      >
        {main}
      </main>
    </div>
  );
}
