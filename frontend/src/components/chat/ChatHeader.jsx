import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { Avatar } from "../sidebar/Sidebar";
import { deleteChat } from "../../api/chats";

export default function ChatHeader({ chat, onBack, onChatDeleted }) {
  const { user } = useAuth();
  const { onlineUserIds, typingUsers } = useWebSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!chat) return null;

  const name = chat.name || "Direct Message";
  const other = chat.members?.find(m => m.user_id !== user?.id);
  const isOnline = other ? onlineUserIds.has(other.user_id) : false;
  const typingList = Object.values(typingUsers);

  const handleDeleteChat = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteChat(chat.id);
      onChatDeleted(chat.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-3"
      style={{ height: 56, background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>

      {/* Back — mobile */}
      <button onClick={onBack}
        className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors active:scale-90"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>

      <Avatar name={name} size={9} online={isOnline} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
        {typingList.length > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--accent)" }}>typing</span>
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full" style={{
                background: "var(--accent)",
                animation: `bounce-dot .9s ease ${i*.18}s infinite`,
                display: "inline-block"
              }}/>
            ))}
          </div>
        ) : (
          <p className="text-xs transition-colors duration-300"
            style={{ color: isOnline ? "var(--online)" : "var(--text-muted)" }}>
            {isOnline ? "online" : "offline"}
          </p>
        )}
      </div>

      {/* More menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-50 py-1 animate-pop"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-elevated)", minWidth: 170 }}
            onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}
          >
            <button
              onClick={handleDeleteChat}
              disabled={deleting}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
              style={{ color: confirmDelete ? "#fff" : "#ef5350", background: confirmDelete ? "rgba(229,57,53,.7)" : "transparent" }}
              onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(229,57,53,.1)"; }}
              onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = "transparent"; }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              {deleting ? "Deleting…" : confirmDelete ? "Tap again to confirm" : "Delete chat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
