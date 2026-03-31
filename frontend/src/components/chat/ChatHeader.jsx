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
    <div className="flex-shrink-0 flex items-center gap-3 px-4"
      style={{ height: 58, background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>

      {/* Back — mobile */}
      <button onClick={onBack}
        className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
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
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--accent-light)" }}>typing</span>
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full inline-block" style={{
                background: "var(--accent-light)",
                animation: `bounce-dot .9s ease ${i*.18}s infinite`,
              }}/>
            ))}
          </div>
        ) : (
          <p className="text-xs transition-colors duration-500"
            style={{ color: isOnline ? "var(--online)" : "var(--text-muted)" }}>
            {isOnline ? "online" : "offline"}
          </p>
        )}
      </div>

      {/* More menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <circle cx="12" cy="5"  r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 py-1.5 animate-pop"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-elevated)", minWidth: 180 }}
            onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}>
            <button onClick={handleDeleteChat} disabled={deleting}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 rounded-xl mx-1 transition-all"
              style={{
                width: "calc(100% - 8px)",
                color: confirmDelete ? "#fff" : "#f87171",
                background: confirmDelete ? "rgba(239,68,68,.7)" : "transparent",
              }}
              onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
              onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = "transparent"; }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete chat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
