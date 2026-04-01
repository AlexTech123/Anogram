import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage, reactToMessage, editMessage } from "../../api/messages";
import { Avatar } from "../sidebar/Sidebar";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const LONG_PRESS_MS = 500;

export default function MessageBubble({ message, onDeleted, showSender, onReply, observerRef, onEdit }) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();

  const [showEmoji, setShowEmoji]       = useState(false);
  const [showContext, setShowContext]    = useState(false); // desktop right-click / mobile long-press
  const [editing, setEditing]           = useState(false);
  const [editText, setEditText]         = useState(message.content);
  const [deleting, setDeleting]         = useState(false);
  // swipe state
  const [swipeX, setSwipeX]             = useState(0);
  const [swiping, setSwiping]           = useState(false);
  const [swipeTriggered, setSwipeTriggered] = useState(false);

  const longPressTimer = useRef(null);
  const touch          = useRef(null);
  const bubbleRef      = useRef(null);
  const editRef        = useRef(null);
  const contextRef     = useRef(null);

  const isMine = message.sender_id === user?.id;
  const isRead = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;

  // Register IntersectionObserver
  useEffect(() => {
    const el = bubbleRef.current;
    if (!el || !observerRef?.current) return;
    observerRef.current.observe(el);
    return () => observerRef.current?.unobserve(el);
  }, [observerRef]);

  useEffect(() => {
    if (editing) setTimeout(() => editRef.current?.focus(), 30);
  }, [editing]);

  // Close context menu on outside click
  useEffect(() => {
    if (!showContext) return;
    const handler = (e) => {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setShowContext(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [showContext]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Single tap → toggle emoji row
  const handleBubbleClick = () => {
    if (editing) return;
    if (showContext) { setShowContext(false); return; }
    setShowEmoji(v => !v);
    setShowContext(false);
  };

  // Right-click (desktop) → context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContext(v => !v);
    setShowEmoji(false);
  };

  // Long press (mobile) → context menu
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
    setSwipeTriggered(false);
    longPressTimer.current = setTimeout(() => {
      setShowContext(true);
      setShowEmoji(false);
      // Subtle haptic if available
      navigator.vibrate?.(30);
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e) => {
    if (!touch.current) return;
    clearTimeout(longPressTimer.current); // cancel long press on move

    const dx = e.touches[0].clientX - touch.current.x;
    const dy = Math.abs(e.touches[0].clientY - touch.current.y);
    if (dy > 20) { setSwiping(false); setSwipeX(0); return; }

    // Swipe LEFT to reply
    if (dx < 0 && dx > -90) {
      setSwiping(true);
      setSwipeX(dx);
      if (dx < -55 && !swipeTriggered) {
        setSwipeTriggered(true);
        navigator.vibrate?.(20);
      }
    }
  };

  const onTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (swipeX < -55) {
      onReply?.(message);
    }
    // Bounce back animation
    setSwipeX(0);
    setSwiping(false);
    setSwipeTriggered(false);
    touch.current = null;
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    setShowContext(false);
    try { await deleteMessage(message.id); onDeleted(message.id); }
    catch { setDeleting(false); }
  };

  const handleReply = (e) => {
    e?.stopPropagation();
    onReply?.(message);
    setShowContext(false);
    setShowEmoji(false);
  };

  const handleReact = async (emoji) => {
    setShowEmoji(false);
    await reactToMessage(message.id, emoji);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || editText === message.content) { setEditing(false); return; }
    await editMessage(message.id, editText);
    onEdit?.(message.id, editText.trim());
    setEditing(false);
  };

  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs px-3 py-1 rounded-full"
          style={{ background: "rgba(124,111,255,.12)", color: "var(--text-secondary)" }}>
          {message.content}
        </span>
      </div>
    );
  }

  // Swipe: scale icon hint
  const swipeProgress = Math.min(Math.abs(swipeX) / 55, 1); // 0→1

  return (
    <div
      ref={bubbleRef}
      data-message-id={message.id}
      className={`flex ${showSender ? "mt-4" : "mt-1.5"} ${isMine ? "justify-end" : "justify-start"}`}
      style={{ position: "relative" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe reply icon — revealed behind the bubble */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          [isMine ? "right" : "left"]: 0,
          top: "50%", transform: "translateY(-50%)",
          width: 36, height: 36, borderRadius: "50%",
          background: `rgba(124,111,255,${swipeProgress * 0.85})`,
          opacity: swipeProgress,
          scale: `${0.5 + swipeProgress * 0.5}`,
          transition: swiping ? "none" : "opacity .25s, scale .25s",
          zIndex: 0,
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "white", opacity: swipeProgress }}>
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
        </svg>
      </div>

      {/* Message column */}
      <div
        className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] sm:max-w-[62%]`}
        style={{
          transform: swipeX ? `translateX(${swipeX * 0.48}px)` : "translateX(0)",
          transition: swiping ? "none" : "transform .3s cubic-bezier(.25,.8,.25,1)",
          zIndex: 1,
          position: "relative",
        }}
      >
        {!isMine && showSender && (
          <div className="flex items-center gap-1.5 mb-1 px-3">
            <Avatar name={message.sender_username || "?"} size={5} src={message.sender_avatar} />
            <span className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>
              @{message.sender_username}
            </span>
          </div>
        )}

        {/* Bubble + context menu wrapper */}
        <div style={{ position: "relative" }}>
          <div
            className={`${isMine ? "bubble-out animate-msg-in" : "bubble-in animate-msg-in"}`}
            style={{ padding: "8px 12px 6px 12px", cursor: "pointer", userSelect: "none" }}
            onClick={handleBubbleClick}
            onContextMenu={handleContextMenu}
          >
            {message.reply_to && (
              <div className="rounded-xl px-3 py-2 mb-2 text-xs"
                style={{ background: isMine ? "rgba(0,0,0,.2)" : "var(--bg-elevated)", borderLeft: `3px solid ${isMine ? "rgba(255,255,255,.4)" : "var(--accent)"}` }}>
                <p className="font-semibold mb-0.5 truncate" style={{ color: isMine ? "rgba(255,255,255,.7)" : "var(--accent-light)" }}>
                  @{message.reply_to.sender_username}
                </p>
                <p className="truncate" style={{ color: isMine ? "rgba(255,255,255,.55)" : "var(--text-muted)" }}>
                  {message.reply_to.content || "Message deleted"}
                </p>
              </div>
            )}

            {message.media_url && <MediaPreview msg={message} />}

            {editing ? (
              <div className="flex gap-2 items-end">
                <textarea ref={editRef}
                  className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
                  style={{ color: isMine ? "#fff" : "var(--text-primary)", minWidth: 120 }}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  rows={1} />
                <button onClick={handleEditSubmit}
                  className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>Save</button>
              </div>
            ) : (
              message.content && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                  style={{ color: isMine ? "#fff" : "var(--text-primary)" }}>
                  {message.content}
                </p>
              )
            )}

            <div className="flex items-center justify-end gap-1.5" style={{ marginTop: 4 }}>
              {message.edited_at && (
                <span style={{ color: isMine ? "rgba(255,255,255,.35)" : "var(--text-muted)", fontSize: 9 }}>edited</span>
              )}
              <span className="text-xs select-none"
                style={{ color: isMine ? "rgba(255,255,255,.5)" : "var(--text-muted)", lineHeight: 1 }}>
                {formatTime(message.created_at)}
              </span>
              {isMine && <Ticks read={isRead} />}
            </div>
          </div>

          {/* Context menu (right-click / long-press) */}
          {showContext && (
            <div
              ref={contextRef}
              className="absolute z-50 animate-pop rounded-2xl overflow-hidden shadow-2xl"
              style={{
                [isMine ? "right" : "left"]: 0,
                bottom: "calc(100% + 6px)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                minWidth: 160,
              }}
            >
              <button onClick={handleReply}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                  <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                </svg>
                Reply
              </button>
              {isMine && (
                <button onClick={() => { setEditing(true); setShowContext(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Edit
                </button>
              )}
              {isMine && (
                <button onClick={handleDelete} disabled={deleting}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "#f87171" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Emoji row — shown on tap */}
        {showEmoji && (
          <div className="flex items-center gap-1 mt-1 px-1 animate-fade-in"
            style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}>
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={() => handleReact(e)}
                className="text-lg rounded-xl transition-all hover:scale-125 active:scale-90"
                style={{ lineHeight: 1, padding: "2px 4px" }}>
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Reaction bubbles */}
        {message.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1"
            style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}>
            {message.reactions.map(r => (
              <button key={r.emoji} onClick={() => handleReact(r.emoji)}
                className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition-all active:scale-95"
                style={{
                  background: r.mine ? "rgba(124,111,255,.25)" : "var(--bg-elevated)",
                  border: r.mine ? "1px solid rgba(124,111,255,.5)" : "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}>
                <span>{r.emoji}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPreview({ msg }) {
  const url = msg.media_url;
  if (msg.message_type === "voice") {
    return (
      <div className="mb-1.5" onClick={e => e.stopPropagation()}>
        <audio controls src={url} preload="metadata" style={{ height: 36, maxWidth: 220, borderRadius: 12 }} />
      </div>
    );
  }
  if (msg.message_type === "image") {
    return (
      <img src={url} alt="" loading="lazy" className="rounded-xl mb-1.5 max-w-full cursor-pointer"
        style={{ maxHeight: 260, objectFit: "cover" }}
        onClick={e => { e.stopPropagation(); window.open(url, "_blank"); }} />
    );
  }
  if (msg.message_type === "video") {
    return (
      <div className="mb-1.5" onClick={e => e.stopPropagation()}>
        <video controls src={url} preload="metadata" className="rounded-xl max-w-full" style={{ maxHeight: 260 }} />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 mb-1.5 px-3 py-2 rounded-xl text-xs no-underline"
      style={{ background: "rgba(255,255,255,.08)", color: "inherit" }}
      onClick={e => e.stopPropagation()}>
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
      </svg>
      <span className="truncate">{url.split("/").pop()}</span>
    </a>
  );
}

function Ticks({ read }) {
  const color = read ? "#a78bfa" : "rgba(255,255,255,.45)";
  if (!read) return (
    <svg viewBox="0 0 10 11" style={{ width: 10, height: 10, flexShrink: 0 }}>
      <polyline points="1,5.5 4,8.5 9,3" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 16 11" style={{ width: 15, height: 10, flexShrink: 0, transition: "stroke .4s" }}>
      <polyline points="1,5.5 4.5,9 10,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="5,5.5 8.5,9 14,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
