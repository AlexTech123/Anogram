import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { useGlobalWS } from "../../context/GlobalWSContext";
import { Avatar } from "../sidebar/Sidebar";
import { deleteChat } from "../../api/chats";
import { setNickname as apiSetNickname, deleteNickname as apiDeleteNickname } from "../../api/nicknames";

export default function ChatHeader({ chat, onBack, onChatDeleted, onRename }) {
  const { user } = useAuth();
  const { typingUsers } = useWebSocket();
  const { onlineIds } = useGlobalWS();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const inputRef = useRef(null);

  const other = chat?.members?.find(m => m.user_id !== user?.id);

  useEffect(() => {
    if (renaming) {
      setNameInput(chat?.partner_username || "");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [renaming]);

  if (!chat) return null;

  const displayName = chat?.partner_username
    ? `@${chat.partner_username}`
    : (chat.name || "Direct Message");
  const originalUsername = other?.user?.username || "";
  const isRenamed = chat?.partner_username && chat?.partner_username !== originalUsername;
  const isOnline = other ? (onlineIds?.has(other.user_id) ?? false) : false;
  const typingList = Object.values(typingUsers);

  const commitRename = async () => {
    if (!other) return;
    const name = nameInput.trim();
    if (name && name !== originalUsername) {
      await apiSetNickname(other.user_id, name);
      onRename?.(name);
    } else {
      await apiDeleteNickname(other.user_id);
      onRename?.(originalUsername);
    }
    setRenaming(false);
    setShowMenu(false);
  };

  const clearNickname = async () => {
    if (!other) return;
    await apiDeleteNickname(other.user_id);
    onRename?.(originalUsername);
    setShowMenu(false);
  };

  const handleDeleteChat = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await deleteChat(chat.id); onChatDeleted(chat.id); }
    finally { setDeleting(false); setConfirmDelete(false); setShowMenu(false); }
  };

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4"
      style={{ height: 58, background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>

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
              renamed
            </span>
          )}
        </div>
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
                      Save
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
                      Rename contact
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
                        Reset to @{originalUsername}
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
                {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete chat"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
