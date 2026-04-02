import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { useGlobalWS } from "../../context/GlobalWSContext";
import { Avatar } from "../sidebar/Sidebar";
import { deleteChat } from "../../api/chats";
import { setNickname as apiSetNickname, deleteNickname as apiDeleteNickname } from "../../api/nicknames";
import { getLastSeen } from "../../api/users";

export default function ChatHeader({ chat, onBack, onChatDeleted, onRename, onSearchToggle }) {
  const { user } = useAuth();
  const { typingUsers } = useWebSocket();
  const { onlineIds } = useGlobalWS();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [lastSeenText, setLastSeenText] = useState(null);
  const inputRef = useRef(null);

  const other = chat?.members?.find(m => m.user_id !== user?.id);

  useEffect(() => {
    if (renaming) {
      setNameInput(chat?.partner_username || "");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [renaming]);

  if (!chat) return null;

  const originalUsername = other?.user?.username || "";
  const isRenamed = chat?.partner_username && chat?.partner_username !== originalUsername;
  // Show @ only when displaying original username, not a custom nickname
  const displayName = isRenamed
    ? chat.partner_username
    : (originalUsername ? `@${originalUsername}` : (chat.name || "Личное сообщение"));
  const isOnline = other ? (onlineIds?.has(other.user_id) ?? false) : false;
  const typingList = Object.values(typingUsers);

  // Fetch last seen when offline
  useEffect(() => {
    if (!other || isOnline) { setLastSeenText(null); return; }
    getLastSeen(other.user_id).then(r => setLastSeenText(r.data.text)).catch(() => {});
  }, [other?.user_id, isOnline]);

  const commitRename = async () => {
    if (!other) return;
    const name = nameInput.trim();
    if (name && name !== originalUsername) {
      await apiSetNickname(other.user_id, name);
      onRename?.(name, true);   // isNickname = true
    } else {
      await apiDeleteNickname(other.user_id);
      onRename?.(originalUsername, false);  // isNickname = false → show @
    }
    setRenaming(false);
    setShowMenu(false);
  };

  const clearNickname = async () => {
    if (!other) return;
    await apiDeleteNickname(other.user_id);
    onRename?.(originalUsername, false);
    setShowMenu(false);
  };

  const handleDeleteChat = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await deleteChat(chat.id); onChatDeleted(chat.id); }
    finally { setDeleting(false); setConfirmDelete(false); setShowMenu(false); }
  };

  return (
    <div className="glass-panel flex-shrink-0 flex items-center gap-3 px-4"
      style={{ height: 58, borderBottom: "1px solid var(--glass-border)" }}>

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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
            {displayName}
          </p>
          {isRenamed && (
            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(124,111,255,.15)", color: "var(--accent-light)", fontSize: 10 }}>
              переименован
            </span>
          )}
        </div>
        <div style={{ height: 16, overflow: "hidden" }}>
          {typingList.length > 0 ? (
            <div className="flex items-center gap-1.5 animate-fade-in">
              {[0,1,2].map(i => (
                <span key={i} className="rounded-full inline-block" style={{
                  width: 4, height: 4,
                  background: "var(--accent-light)",
                  animation: `bounce-dot .9s ease ${i*.18}s infinite`,
                }}/>
              ))}
              <span className="text-xs" style={{ color: "var(--accent-light)" }}>печатает…</span>
            </div>
          ) : (
            <p className="text-xs transition-all duration-500 animate-fade-in"
              style={{ color: isOnline ? "var(--online)" : "var(--text-muted)" }}>
              {isOnline
                ? <span className="flex items-center gap-1">
                    <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"var(--online)", boxShadow:"0 0 6px var(--online)", animation:"glow 2s ease-in-out infinite" }}/>
                    в сети
                  </span>
                : lastSeenText ? `был(а) ${lastSeenText}` : "не в сети"}
            </p>
          )}
        </div>
      </div>

      {/* Search toggle */}
      <button onClick={onSearchToggle}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-none stroke-current" style={{ width: 18, height: 18 }}
          strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>

      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowMenu(v => !v); setConfirmDelete(false); setRenaming(false); }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 animate-pop overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-elevated)", minWidth: 210 }}
            onMouseLeave={() => { if (!renaming) { setShowMenu(false); setConfirmDelete(false); } }}>

            {other && (
              <div style={{ borderBottom: "1px solid var(--bg-elevated)" }}>
                {renaming ? (
                  <div className="px-3 py-2.5 flex items-center gap-2">
                    <input ref={inputRef}
                      className="flex-1 bg-transparent outline-none text-sm rounded-lg px-2 py-1.5 min-w-0"
                      style={{ color: "var(--text-primary)", background: "var(--bg-elevated)", border: "1px solid var(--accent)" }}
                      placeholder={originalUsername}
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false); }}
                      maxLength={40} />
                    <button onClick={commitRename}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-semibold flex-shrink-0"
                      style={{ background: "var(--accent)", color: "#fff" }}>
                      Сохранить
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setRenaming(true)}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-all"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      Переименовать контакт
                    </button>
                    {isRenamed && (
                      <button onClick={clearNickname}
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition-all"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Сбросить (@{originalUsername})
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="p-1.5">
              <button onClick={handleDeleteChat} disabled={deleting}
                className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 rounded-xl transition-all"
                style={{ color: confirmDelete ? "#fff" : "#f87171", background: confirmDelete ? "rgba(239,68,68,.7)" : "transparent" }}
                onMouseEnter={e => { if (!confirmDelete) e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                onMouseLeave={e => { if (!confirmDelete) e.currentTarget.style.background = "transparent"; }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                {deleting ? "Удаление…" : confirmDelete ? "Подтвердить" : "Удалить чат"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
