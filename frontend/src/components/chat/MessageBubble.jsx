import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage, reactToMessage, editMessage } from "../../api/messages";
import { Avatar } from "../sidebar/Sidebar";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const QUICK_EMOJIS  = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const LONG_PRESS_MS = 500;
const SWIPE_TRIGGER = 40;
const SWIPE_MAX     = 70;

export default function MessageBubble({
  message, onDeleted, showSender, isLastInGroup, onReply, observerRef, onEdit, resolveUsername,
}) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();

  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editText,    setEditText]    = useState(message.content);
  const [deleting,    setDeleting]    = useState(false);
  const [swipeX,      setSwipeX]      = useState(0);
  const [swiping,     setSwiping]     = useState(false);

  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);
  const menuOpening    = useRef(false); // true while opening finger is still down
  const touch          = useRef(null);
  const swipeTriggered = useRef(false);
  const bubbleRef  = useRef(null);
  const contextRef = useRef(null);
  const editRef    = useRef(null);

  const isMine       = message.sender_id === user?.id;
  const isRead       = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;
  const swipeProgress = Math.min(Math.abs(swipeX) / SWIPE_TRIGGER, 1);

  const rn = (name) => resolveUsername?.(name) ?? name; // resolve nickname helper

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el || !observerRef?.current) return;
    observerRef.current.observe(el);
    return () => observerRef.current?.unobserve(el);
  }, [observerRef]);

  useEffect(() => {
    if (editing) setTimeout(() => editRef.current?.focus(), 30);
  }, [editing]);

  // Context menu is closed by a transparent backdrop — no document listeners,
  // no timing issues with ghost touch events on mobile.

  // Touch
  const onTouchStart = (e) => {
    longPressFired.current = false;
    swipeTriggered.current = false;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      menuOpening.current    = true;  // finger still down
      setShowContext(true);
      setShowEmoji(false);
      navigator.vibrate?.(30);
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e) => {
    if (!touch.current) return;
    clearTimeout(longPressTimer.current);
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = Math.abs(e.touches[0].clientY - touch.current.y);
    if (dy > 18 || dx > 0) { setSwiping(false); setSwipeX(0); return; }
    const raw = Math.abs(dx);
    const clamped = Math.min(
      raw <= SWIPE_TRIGGER ? raw : SWIPE_TRIGGER + (raw - SWIPE_TRIGGER) * 0.25,
      SWIPE_MAX
    );
    setSwiping(true);
    setSwipeX(-clamped);
    if (raw >= SWIPE_TRIGGER && !swipeTriggered.current) {
      swipeTriggered.current = true;
      navigator.vibrate?.(18);
    }
  };

  const onTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (swipeTriggered.current) onReply?.(message);
    setSwipeX(0); setSwiping(false);
    swipeTriggered.current = false;
    touch.current = null;
    // Finger lifted — next touch on backdrop is allowed to close menu
    menuOpening.current = false;
  };

  const handleBubbleClick = () => {
    if (editing) return;
    if (longPressFired.current) { longPressFired.current = false; return; }
    if (showContext) { setShowContext(false); return; }
    setShowEmoji(v => !v);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContext(v => !v);
    setShowEmoji(false);
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    if (deleting) return;
    setDeleting(true); setShowContext(false);
    try { await deleteMessage(message.id); onDeleted(message.id); }
    catch { setDeleting(false); }
  };

  const handleReply = (e) => {
    e?.stopPropagation();
    onReply?.(message);
    setShowContext(false); setShowEmoji(false);
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

  return (
    <div
      ref={bubbleRef}
      data-message-id={message.id}
      className={`flex ${showSender ? "mt-3.5" : "mt-0.5"} ${isMine ? "justify-end" : "justify-start"}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Message column */}
      <div
        className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] sm:max-w-[62%]`}
        style={{
          transform: swipeX ? `translateX(${swipeX}px)` : "translateX(0)",
          transition: swiping
            ? "none"
            : "transform .3s cubic-bezier(.25,.8,.25,1), height .2s ease",
          position: "relative",
        }}
      >
        {/* Sender name (group chats only) */}
        {!isMine && showSender && (
          <div className="flex items-center gap-1.5 mb-1 px-3">
            <Avatar name={message.sender_username || "?"} size={5} src={message.sender_avatar} />
            <span className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>
              @{rn(message.sender_username)}
            </span>
          </div>
        )}

        {/* Swipe reply indicator */}
        <div style={{
          position: "absolute",
          right: isMine ? "calc(100% + 6px)" : undefined,
          left:  isMine ? undefined : "calc(100% + 6px)",
          top: "50%",
          transform: `translateY(-50%) scale(${0.4 + swipeProgress * 0.6})`,
          width: 30, height: 30, borderRadius: "50%",
          background: `rgba(124,111,255,${swipeProgress * 0.9})`,
          opacity: swipeProgress,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: swiping ? "none" : "opacity .25s, transform .25s",
          pointerEvents: "none",
        }}>
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "white" }}>
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
          </svg>
        </div>

        {/* Bubble wrapper — position:relative so emoji overlay is anchored here */}
        <div style={{ position: "relative" }}>

          {/* Bubble */}
          <div
            className={`animate-msg-in ${isMine
              ? isLastInGroup ? "bubble-out" : "bubble-out-notail"
              : isLastInGroup ? "bubble-in"  : "bubble-in-notail"
            }`}
            style={{ padding: "8px 12px 6px 12px", cursor: "pointer", userSelect: "none" }}
            onClick={handleBubbleClick}
            onContextMenu={handleContextMenu}
          >
            {/* Reply quote */}
            {message.reply_to && (
              <div className="rounded-xl px-3 py-2 mb-2 text-xs"
                style={{ background: isMine ? "rgba(0,0,0,.2)" : "var(--bg-elevated)", borderLeft: `3px solid ${isMine ? "rgba(255,255,255,.4)" : "var(--accent)"}` }}>
                <p className="font-semibold mb-0.5 truncate" style={{ color: isMine ? "rgba(255,255,255,.7)" : "var(--accent-light)" }}>
                  @{rn(message.reply_to.sender_username)}
                </p>
                <p className="truncate" style={{ color: isMine ? "rgba(255,255,255,.55)" : "var(--text-muted)" }}>
                  {message.reply_to.content || "Сообщение удалено"}
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
                  style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>Сохранить</button>
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
                <span style={{ color: isMine ? "rgba(255,255,255,.35)" : "var(--text-muted)", fontSize: 9 }}>изм.</span>
              )}
              <span className="text-xs select-none"
                style={{ color: isMine ? "rgba(255,255,255,.5)" : "var(--text-muted)", lineHeight: 1 }}>
                {formatTime(message.created_at)}
              </span>
              {isMine && <Ticks read={isRead} />}
            </div>
          </div>

          {/* Backdrop via portal — rendered at document.body so z-index is
              guaranteed above all message bubbles regardless of stacking context */}
          {showContext && createPortal(
            <div
              style={{ position: "fixed", inset: 0, zIndex: 999 }}
              onTouchStart={() => {
                if (!menuOpening.current) setShowContext(false);
              }}
              onMouseDown={() => setShowContext(false)}
            />,
            document.body
          )}

          {/* Context menu sits above the portal backdrop */}
          {showContext && (
            <div ref={contextRef}
              className="absolute animate-pop rounded-2xl overflow-hidden shadow-2xl"
              style={{
                [isMine ? "right" : "left"]: 0,
                bottom: "calc(100% + 6px)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                minWidth: 160,
                zIndex: 1000,
              }}>
              <button onClick={handleReply}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                  <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                </svg>
                Ответить
              </button>
              {isMine && (
                <button onClick={() => { setEditing(true); setShowContext(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Изменить
                </button>
              )}
              {isMine && (
                <button onClick={handleDelete} disabled={deleting}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                  style={{ color: "#f87171", borderTop: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  {deleting ? "Удаление…" : "Удалить"}
                </button>
              )}
            </div>
          )}

          {/* Emoji overlay — floats above bubble, no layout shift */}
          <div style={{
            position: "absolute",
            [isMine ? "right" : "left"]: 0,
            bottom: "calc(100% + 4px)",
            display: "flex", alignItems: "center", gap: 2,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "4px 6px",
            boxShadow: "0 4px 20px rgba(0,0,0,.4)",
            opacity: showEmoji ? 1 : 0,
            transform: showEmoji ? "translateY(0) scale(1)" : "translateY(6px) scale(0.9)",
            pointerEvents: showEmoji ? "auto" : "none",
            transition: "opacity .18s ease, transform .18s cubic-bezier(.34,1.56,.64,1)",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}>
            {QUICK_EMOJIS.map((e, i) => (
              <button key={e} onClick={() => handleReact(e)}
                className="transition-all hover:scale-125 active:scale-90"
                style={{
                  fontSize: 20, lineHeight: 1, padding: "1px 3px",
                  opacity: showEmoji ? 1 : 0,
                  transform: showEmoji ? "scale(1)" : "scale(0.5)",
                  transition: `opacity .15s ease ${i * 25}ms, transform .18s cubic-bezier(.34,1.56,.64,1) ${i * 25}ms`,
                }}>
                {e}
              </button>
            ))}
            {isMine && !editing && (
              <button onClick={() => { setEditing(true); setShowEmoji(false); }}
                className="text-xs rounded-xl px-2 py-1 transition-all ml-1"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                ✎
              </button>
            )}
          </div>

        </div>{/* end bubble wrapper */}

        {/* Reaction bubbles — animate in/out smoothly */}
        {message.reactions?.length > 0 && (
          <div
            className="flex flex-wrap gap-1 px-1"
            style={{
              justifyContent: isMine ? "flex-end" : "flex-start",
              marginTop: 3,
              transition: "height .2s ease",
            }}
          >
            {message.reactions.map((r, i) => (
              <button
                key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 active:scale-95"
                style={{
                  background: r.mine ? "rgba(124,111,255,.25)" : "var(--bg-elevated)",
                  border: r.mine ? "1px solid rgba(124,111,255,.5)" : "1px solid var(--border)",
                  color: "var(--text-primary)",
                  animation: `reactionIn .2s cubic-bezier(.34,1.56,.64,1) ${i * 30}ms both`,
                  transition: "background .2s, border-color .2s, transform .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <span>{r.emoji}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 11, transition: "color .2s" }}>
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        )}

      </div>{/* end message column */}
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
