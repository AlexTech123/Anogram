import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";

export default function Sidebar({ chats, activeChatId, onSelectChat, onChatCreated }) {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            A
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>Anogram</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          title="New chat"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-105"
          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
          </svg>
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        <ChatList chats={chats} activeChatId={activeChatId} onSelect={onSelectChat} currentUser={user} />
      </div>

      {/* User footer */}
      <div
        className="px-3 py-3 flex items-center gap-2.5 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <Avatar name={user?.display_name || user?.username || "?"} size={8} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {user?.display_name || user?.username}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>@{user?.username}</p>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        </button>
      </div>

      {showModal && (
        <NewChatModal
          onClose={() => setShowModal(false)}
          onCreated={(chat) => {
            onChatCreated(chat);
            onSelectChat(chat.id);
          }}
        />
      )}
    </>
  );
}

export function Avatar({ name, size = 10 }) {
  const colors = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#0ea5e9,#6366f1)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#10b981,#0ea5e9)",
    "linear-gradient(135deg,#f97316,#ec4899)",
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  const s = size * 4;
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: s,
        height: s,
        fontSize: s * 0.38,
        background: colors[idx],
      }}
    >
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}
