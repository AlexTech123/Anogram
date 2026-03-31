import { Avatar } from "./Sidebar";

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = (now - d) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function ChatList({ chats, activeChatId, onSelect, currentUser }) {
  if (!chats.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <svg viewBox="0 0 24 24" className="w-14 h-14 opacity-20 fill-current" style={{ color: "var(--text-secondary)" }}>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No messages yet</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tap + to start a conversation</p>
      </div>
    );
  }

  return (
    <ul>
      {chats.map((chat, i) => {
        const isActive = chat.id === activeChatId;
        const name = chat.name || "Direct Message";
        const last = chat.last_message;
        const previewSender = last?.sender_username === currentUser?.username ? "You: " : "";
        const preview = last ? `${previewSender}${last.content}` : "No messages yet";

        return (
          <li key={chat.id} className="animate-slide-in" style={{ animationDelay: `${i * 20}ms` }}>
            <button
              onClick={() => onSelect(chat.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors active:opacity-80"
              style={{ background: isActive ? "var(--bg-active)" : "transparent" }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Avatar name={name} size={12} />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {name}
                  </p>
                  {last && (
                    <span className="flex-shrink-0 text-xs" style={{ color: isActive ? "rgba(255,255,255,.6)" : "var(--text-muted)" }}>
                      {formatTime(last.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: isActive ? "rgba(255,255,255,.6)" : "var(--text-muted)" }}>
                  {preview}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
