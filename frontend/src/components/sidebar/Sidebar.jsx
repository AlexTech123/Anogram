import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../api/users";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";

// LocalStorage key for custom nicknames
const NICKNAMES_KEY = "anogram_nicknames";

export function useNicknames() {
  const [nicknames, setNicknames] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NICKNAMES_KEY) || "{}"); }
    catch { return {}; }
  });
  const set = (userId, name) => {
    setNicknames(prev => {
      const next = { ...prev, [userId]: name };
      localStorage.setItem(NICKNAMES_KEY, JSON.stringify(next));
      return next;
    });
  };
  const get = (userId) => nicknames[String(userId)] || null;
  return { get, set, nicknames };
}

export default function Sidebar({ chats, activeChatId, onSelectChat, onChatCreated, onDeselectChat, onlineIds, currentUser }) {
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

  const iAmOnline = user ? onlineIds?.has(user.id) : false;

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-2.5 px-4"
        style={{ height: 58, borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}
      >
        <span
          className="flex-1 font-black tracking-tight select-none"
          style={{
            fontSize: 23,
            background: "linear-gradient(90deg, #a78bfa, #818cf8, #60a5fa, #c084fc, #a78bfa)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
            animation: "gradient-shift 6s ease infinite",
          }}
        >
          Anogram
        </span>
        <button
          onClick={() => setShowModal(true)}
          title="New message"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--accent-light)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M20 13h-7v7h-2v-7H4v-2h7V4h2v7h7z"/>
          </svg>
        </button>
      </div>

      {/* ── Chat list ────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelect={onSelectChat}
          currentUser={user}
          onlineIds={onlineIds}
        />
      </div>

      {/* ── Bottom panel — always pinned ─────────────────────────── */}
      <div className="flex-shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>

        {/* Back to chats — only when a chat is active */}
        {activeChatId && (
          <button
            onClick={onDeselectChat}
            className="w-full flex items-center gap-2.5 px-4 py-2 transition-all text-left"
            style={{ color: "var(--text-muted)", fontSize: 12 }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            All chats
          </button>
        )}

        {/* User row — click opens menu */}
        <div className="relative">
          <button
            onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 transition-all"
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Avatar name={user?.username || "?"} size={8} online={iAmOnline} />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                @{user?.username}
              </p>
              <p className="text-xs" style={{ color: iAmOnline ? "var(--online)" : "var(--text-muted)" }}>
                {iAmOnline ? "online" : "offline"}
              </p>
            </div>
            {/* Chevron instead of three dots */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 fill-current transition-transform duration-200"
              style={{ color: "var(--text-muted)", transform: showMenu ? "rotate(180deg)" : "rotate(0deg)" }}>
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>

          {showMenu && (
            <div
              className="absolute left-2 right-2 bottom-full mb-2 rounded-2xl shadow-2xl z-50 animate-pop overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}
            >
              <div className="px-4 py-3 flex items-center gap-2.5"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08))", borderBottom: "1px solid var(--border)" }}>
                <Avatar name={user?.username || "?"} size={8} online={iAmOnline} />
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
                  style={{ color: confirmDelete ? "#fff" : "#f87171", background: confirmDelete ? "rgba(239,68,68,.6)" : "transparent" }}
                  onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                  onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = confirmDelete ? "rgba(239,68,68,.6)" : "transparent"; }}>
                  <svg viewObj="0 0 24 24" viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete account"}
                </button>
              </div>
            </div>
          )}
        </div>
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

export function Avatar({ name = "?", size = 10, online = null }) {
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
      {online !== null && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 transition-all duration-500"
          style={{ background: online ? "var(--online)" : "#4b5563", borderColor: "var(--bg-sidebar)", boxShadow: online ? "0 0 6px var(--online)" : "none" }} />
      )}
    </div>
  );
}
