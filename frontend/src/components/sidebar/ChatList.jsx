import { Avatar } from "./Sidebar";

function formatTime(iso) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = (now - d) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function ChatList({ chats, activeChatId, onSelect, currentUser, onlineIds }) {
  if (!chats.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}>
          <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-40 fill-current" style={{ color: "var(--accent)" }}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No messages yet</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tap + to start a conversation</p>
      </div>
    );
  }

  return (
    <ul className="py-1">
      {chats.map((chat, i) => {
        const isActive = chat.id === activeChatId;
        const name = chat.chat_type === "dm"
          ? (chat.partner_username ? `@${chat.partner_username}` : "Direct Message")
          : (chat.name || "Group");
        const preview = chat.last_message?.content || "";
        const unread = isActive ? 0 : (chat.unread_count || 0);

        // Determine online status of partner
        let partnerOnline = null;
        if (chat.chat_type === "dm" && chat.partner_user_id && onlineIds) {
          partnerOnline = onlineIds.has(chat.partner_user_id);
        }

        const avatarName = chat.partner_username || chat.name || "?";

        return (
          <li key={chat.id} className="animate-slide-in px-2" style={{ animationDelay: `${i * 25}ms` }}>
            <button
              onClick={() => onSelect(chat.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 active:scale-[.98]"
              style={{ background: isActive ? "var(--bg-active)" : "transparent" }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Avatar name={avatarName} size={12} online={partnerOnline} />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-sm truncate"
                    style={{ color: unread > 0 ? "var(--text-primary)" : isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {name}
                  </p>
                  {chat.last_message && (
                    <span className="flex-shrink-0 text-xs"
                      style={{ color: unread > 0 ? "var(--accent-light)" : "var(--text-muted)" }}>
                      {formatTime(chat.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs truncate flex-1 text-left"
                    style={{ color: unread > 0 ? "var(--text-secondary)" : "var(--text-muted)" }}>
                    {preview}
                  </p>
                  {unread > 0 && (
                    <span className="flex-shrink-0 flex items-center justify-center font-bold text-white rounded-full"
                      style={{
                        background: "var(--accent-gradient)",
                        fontSize: 10, minWidth: 18, height: 18, padding: "0 4px",
                        boxShadow: "0 2px 8px rgba(99,102,241,.5)",
                      }}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
