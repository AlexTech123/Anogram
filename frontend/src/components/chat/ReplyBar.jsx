export default function ReplyBar({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 animate-fade-in"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
        borderLeft: "3px solid var(--accent)",
      }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 fill-current" style={{ color: "var(--accent)" }}>
        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--accent-light)" }}>
          @{replyTo.sender_username}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
          {replyTo.content || "[медиа]"}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        ✕
      </button>
    </div>
  );
}
