import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../api/users";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";

export default function Sidebar({ chats, activeChatId, onSelectChat, onChatCreated }) {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await deleteAccount(); logout(); }
    finally { setDeleting(false); }
  };

  return (
    <>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{ height: 58, borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); }}
            className="transition-all active:scale-90 flex-shrink-0">
            <Avatar name={user?.username || "?"} size={9} />
          </button>

          {showMenu && (
            <div className="absolute left-0 top-full mt-2 rounded-2xl shadow-2xl z-50 animate-pop"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 190, overflow: "hidden" }}
              onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}>

              {/* User info header */}
              <div className="px-4 py-3 flex items-center gap-2.5"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08))", borderBottom: "1px solid var(--border)" }}>
                <Avatar name={user?.username || "?"} size={8} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>@{user?.username}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Anonymous</p>
                </div>
              </div>

              <div className="p-1.5">
                <button onClick={logout}
                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 rounded-xl transition-all"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  Log out
                </button>

                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 rounded-xl transition-all mt-0.5"
                  style={{
                    color: confirmDelete ? "#fff" : "#f87171",
                    background: confirmDelete ? "rgba(239,68,68,.6)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                  onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = confirmDelete ? "rgba(239,68,68,.6)" : "transparent"; }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete account"}
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="flex-1 font-bold text-base" style={{ color: "var(--text-primary)" }}>Anogram</span>

        {/* New chat */}
        <button onClick={() => setShowModal(true)} title="New message"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--accent-light)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M20 13h-7v7h-2v-7H4v-2h7V4h2v7h7z"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatList chats={chats} activeChatId={activeChatId} onSelect={onSelectChat} currentUser={user} />
      </div>

      {showModal && (
        <NewChatModal
          onClose={() => setShowModal(false)}
          onCreated={chat => { onChatCreated(chat); onSelectChat(chat.id); }}
        />
      )}
    </>
  );
}

export function Avatar({ name = "?", size = 10, online = false }) {
  const palettes = [
    ["#818cf8","#6366f1"],["#f472b6","#ec4899"],["#fb923c","#f97316"],
    ["#34d399","#10b981"],["#60a5fa","#3b82f6"],["#a78bfa","#8b5cf6"],
    ["#f9a8d4","#e879f9"],["#67e8f9","#06b6d4"],
  ];
  const [a, b] = palettes[(name.charCodeAt(0) || 65) % palettes.length];
  const px = size * 4;
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-2xl flex items-center justify-center font-bold text-white select-none"
        style={{ width: px, height: px, fontSize: Math.round(px * .4), background: `linear-gradient(135deg,${a},${b})` }}>
        {name.replace(/^@/, "").charAt(0).toUpperCase()}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{ background: "var(--online)", borderColor: "var(--bg-sidebar)", boxShadow: "0 0 6px var(--online)" }} />
      )}
    </div>
  );
}
