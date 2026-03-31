export default function AppLayout({ sidebar, main, showChat }) {
  return (
    <div className="flex w-full h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Sidebar */}
      <aside
        className={[
          "flex-shrink-0 flex flex-col overflow-hidden",
          // Mobile: full screen when no active chat, hidden otherwise
          // Desktop: always 280px
          showChat
            ? "hidden sm:flex sm:w-72"
            : "flex w-full sm:w-72",
        ].join(" ")}
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {sidebar}
      </aside>

      {/* Chat */}
      <main
        className={[
          "flex-col overflow-hidden",
          showChat
            ? "flex flex-1"
            : "hidden sm:flex sm:flex-1",
        ].join(" ")}
      >
        {main}
      </main>
    </div>
  );
}
