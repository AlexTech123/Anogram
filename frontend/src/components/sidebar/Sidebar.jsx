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
    try {
      await deleteAccount();
      logout();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{ height: 56, borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); }}
            className="transition-opacity active:opacity-70 flex-shrink-0">
            <Avatar name={user?.username || "?"} size={9} />
          </button>

          {showMenu && (
            <div
              className="absolute left-0 top-full mt-1 rounded-xl shadow-2xl z-50 py-1 animate-pop"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bg-elevated)", minWidth: 180 }}
              onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}
            >
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--bg-elevated)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  @{user?.username}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Anonymous</p>
              </div>

              <button onClick={logout}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Log out
              </button>

              <div style={{ borderTop: "1px solid var(--bg-elevated)" }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                  style={{
                    color: confirmDelete ? "#fff" : "#ef5350",
                    background: confirmDelete ? "rgba(229,57,53,.7)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(229,57,53,.1)"; }}
                  onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = confirmDelete ? "rgba(229,57,53,.7)" : "transparent"; }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  {deleting ? "Deleting…" : confirmDelete ? "Tap again to confirm" : "Delete account"}
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="flex-1 font-bold text-base" style={{ color: "var(--text-primary)" }}>
          Anogram
        </span>

        <button
          onClick={() => setShowModal(true)}
          title="New message"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
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
    ["#e8677a","#c2185b"],["#ff9955","#e65100"],["#ffd740","#f9a825"],
    ["#69e08a","#2e7d32"],["#40c4ff","#0277bd"],["#7c8aff","#4527a0"],
    ["#ba68c8","#6a1b9a"],["#4dd0e1","#00838f"],
  ];
  const [a, b] = palettes[(name.charCodeAt(0) || 65) % palettes.length];
  const px = size * 4;
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ width: px, height: px, fontSize: Math.round(px * .42), background: `linear-gradient(135deg,${a},${b})` }}>
        {name.replace(/^@/, "").charAt(0).toUpperCase()}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{ background: "var(--online)", borderColor: "var(--bg-sidebar)" }} />
      )}
    </div>
  );
}
