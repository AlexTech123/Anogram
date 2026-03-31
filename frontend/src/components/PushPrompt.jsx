export default function PushPrompt({ onAllow, onDismiss }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-slide-up"
      style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,.6))" }}>
      <div className="rounded-3xl p-4 flex items-start gap-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,.15), rgba(139,92,246,.1))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(124,111,255,.25)",
          boxShadow: "0 0 0 1px rgba(255,255,255,.05) inset",
        }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-gradient)" }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Enable notifications</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Get notified about new messages
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={onAllow}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
              style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 12px rgba(99,102,241,.4)" }}>
              Allow
            </button>
            <button onClick={onDismiss}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,.08)", color: "var(--text-secondary)" }}>
              Not now
            </button>
          </div>
        </div>
        <button onClick={onDismiss}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs transition-opacity"
          style={{ color: "var(--text-muted)", opacity: .6 }}>✕</button>
      </div>
    </div>
  );
}
