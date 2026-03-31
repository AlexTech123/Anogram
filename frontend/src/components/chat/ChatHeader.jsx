import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { useGlobalWS } from "../../context/GlobalWSContext";
import { Avatar } from "../sidebar/Sidebar";
import { deleteChat } from "../../api/chats";

// LocalStorage-based custom nicknames
const NK_KEY = "anogram_nicknames";
function getNickname(userId) {
  try { return JSON.parse(localStorage.getItem(NK_KEY) || "{}")[String(userId)] || null; }
  catch { return null; }
}
function setNickname(userId, name) {
  try {
    const all = JSON.parse(localStorage.getItem(NK_KEY) || "{}");
    if (name.trim()) all[String(userId)] = name.trim();
    else delete all[String(userId)];
    localStorage.setItem(NK_KEY, JSON.stringify(all));
  } catch {}
}

export default function ChatHeader({ chat, onBack, onChatDeleted }) {
  const { user } = useAuth();
  const { typingUsers } = useWebSocket();
  const { onlineIds } = useGlobalWS();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Custom nickname state
  const other = chat?.members?.find(m => m.user_id !== user?.id);
  const [editing, setEditing] = useState(false);
  const [customName, setCustomName] = useState(() =>
    other ? getNickname(other.user_id) : null
  );
  const inputRef = useRef(null);

  useEffect(() => {
    if (other) setCustomName(getNickname(other.user_id));
  }, [chat?.id]);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 30);
  }, [editing]);

  if (!chat) return null;

  const rawName = chat.name || "Direct Message";
  const displayName = customName || rawName;
  const isOnline = other ? (onlineIds?.has(other.user_id) ?? false) : false;
  const typingList = Object.values(typingUsers);

  const saveName = () => {
    if (other) setNickname(other.user_id, customName || "");
    setEditing(false);
  };

  const handleDeleteChat = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await deleteChat(chat.id); onChatDeleted(chat.id); }
    finally { setDeleting(false); setConfirmDelete(false); setShowMenu(false); }
  };

  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-4"
      style={{ height: 58, background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}
    >
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

      <Avatar name={displayName} size={9} online={isOnline} />

      {/* Name — click to edit */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="bg-transparent outline-none border-b text-sm font-semibold w-full"
            style={{ color: "var(--text-primary)", borderColor: "var(--accent)", maxWidth: 180 }}
            value={customName || ""}
            placeholder={rawName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setCustomName(getNickname(other?.user_id)); setEditing(false); } }}
            onBlur={saveName}
            maxLength={40}
          />
        ) : (
          <button
            onClick={() => other && setEditing(true)}
            className="text-left w-full group"
            title={other ? "Click to rename" : undefined}
          >
            <p className="font-semibold text-sm truncate flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              {displayName}
              {other && (
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0"
                  style={{ color: "var(--text-muted)" }}>
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              )}
            </p>
          </button>
        )}

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

      {/* Custom name indicator */}
      {customName && !editing && (
        <button
          onClick={() => { setCustomName(""); setNickname(other?.user_id, ""); }}
          title="Remove custom name"
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full transition-all"
          style={{ background: "rgba(124,111,255,.15)", color: "var(--accent-light)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.15)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.textContent = "✕ reset"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,111,255,.15)"; e.currentTarget.style.color = "var(--accent-light)"; e.currentTarget.textContent = "custom"; }}
        >
          custom
        </button>
      )}

      {/* More menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 py-1.5 animate-pop"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-elevated)", minWidth: 180 }}
            onMouseLeave={() => { setShowMenu(false); setConfirmDelete(false); }}
          >
            {/* Rename option */}
            {other && (
              <button
                onClick={() => { setEditing(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 rounded-xl mx-1 transition-all"
                style={{ width: "calc(100% - 8px)", color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Rename contact
              </button>
            )}
            <button
              onClick={handleDeleteChat} disabled={deleting}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 rounded-xl mx-1 transition-all"
              style={{ width: "calc(100% - 8px)", color: confirmDelete ? "#fff" : "#f87171", background: confirmDelete ? "rgba(239,68,68,.7)" : "transparent" }}
              onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
              onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = "transparent"; }}
            >
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
