export default function AppLayout({ sidebar, main }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <aside
        className="w-72 flex-shrink-0 flex flex-col"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">{main}</main>
    </div>
  );
}
