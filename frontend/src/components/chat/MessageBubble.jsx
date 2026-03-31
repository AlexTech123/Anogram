import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage } from "../../api/messages";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, onDeleted, showSender, onReply, observerRef }) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hideTimer = useRef(null);
  const bubbleRef = useRef(null);

  // Touch state for swipe
  const touchStart = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const isMine = message.sender_id === user?.id;
  const isRead = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;

  // Register with parent IntersectionObserver
  useEffect(() => {
    const el = bubbleRef.current;
    if (!el || !observerRef?.current) return;
    observerRef.current.observe(el);
    return () => observerRef.current?.unobserve(el);
  }, [observerRef]);

  useEffect(() => {
    if (showActions) {
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowActions(false), 3000);
    }
    return () => clearTimeout(hideTimer.current);
  }, [showActions]);

  const handleBubbleTap = () => {
    if (!isMine) return;
    clearTimeout(hideTimer.current);
    setShowActions(v => !v);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    clearTimeout(hideTimer.current);
    try {
      await deleteMessage(message.id);
      onDeleted(message.id);
    } catch {
      setDeleting(false);
      setShowActions(false);
    }
  };

  // Swipe LEFT to reply (both sides)
  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    // Swipe left (dx < 0), ignore if more vertical than horizontal
    if (dy > 20) { setSwiping(false); setSwipeOffset(0); return; }
    if (dx < 0 && dx > -80) {
      setSwiping(true);
      setSwipeOffset(dx); // negative = left
    }
  };

  const onTouchEnd = () => {
    if (swipeOffset < -50) onReply?.(message);
    setSwipeOffset(0);
    setSwiping(false);
    touchStart.current = null;
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
      className={`flex ${showSender ? "mt-3" : "mt-0.5"} animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}
      style={{
        transform: swipeOffset ? `translateX(${swipeOffset * 0.5}px)` : undefined,
        transition: swiping ? "none" : "transform .2s ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={`max-w-[75%] sm:max-w-[62%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && showSender && (
          <span className="text-xs font-semibold mb-1 px-3" style={{ color: "var(--accent-light)" }}>
            @{message.sender_username}
          </span>
        )}

        <div className="flex items-end gap-2 group">
          {/* My message: delete + reply on hover */}
          {isMine && (
            <>
              <button
                onClick={() => onReply?.(message)}
                onMouseDown={e => e.preventDefault()}
                className="flex-shrink-0 w-7 h-7 rounded-full items-center justify-center mb-0.5 transition-all duration-150 hidden sm:flex"
                style={{
                  background: "var(--bg-elevated)", color: "var(--text-muted)",
                  opacity: 0, transform: "scale(0.7)",
                }}
                ref={el => {
                  if (el) {
                    // Controlled by group hover via inline style updated in parent
                  }
                }}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                </svg>
              </button>
              <button
                onClick={handleDelete}
                onMouseDown={e => e.preventDefault()}
                disabled={deleting}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200"
                style={{
                  background: "rgba(239,68,68,.85)",
                  opacity: showActions ? 1 : 0,
                  transform: showActions ? "scale(1)" : "scale(0.5)",
                  pointerEvents: showActions ? "auto" : "none",
                  boxShadow: showActions ? "0 2px 12px rgba(239,68,68,.4)" : "none",
                }}
              >
                {deleting
                  ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" strokeOpacity=".3"/>
                      <path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  : <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                }
              </button>
            </>
          )}

          {/* Bubble */}
          <div
            className={`${isMine ? "bubble-out" : "bubble-in"} relative`}
            style={{ padding: "8px 12px 6px 12px", cursor: isMine ? "pointer" : "default" }}
            onClick={handleBubbleTap}
          >
            {/* Reply quote */}
            {message.reply_to && (
              <div
                className="rounded-xl px-3 py-2 mb-2 text-xs cursor-default"
                style={{
                  background: isMine ? "rgba(0,0,0,.2)" : "var(--bg-elevated)",
                  borderLeft: `3px solid ${isMine ? "rgba(255,255,255,.4)" : "var(--accent)"}`,
                }}
              >
                <p className="font-semibold mb-0.5 truncate"
                  style={{ color: isMine ? "rgba(255,255,255,.7)" : "var(--accent-light)" }}>
                  @{message.reply_to.sender_username}
                </p>
                <p className="truncate" style={{ color: isMine ? "rgba(255,255,255,.55)" : "var(--text-muted)" }}>
                  {message.reply_to.content || "Message deleted"}
                </p>
              </div>
            )}

            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
              style={{ color: isMine ? "#fff" : "var(--text-primary)" }}>
              {message.content}
            </p>

            <div className="flex items-center justify-end gap-1.5" style={{ marginTop: 4 }}>
              <span className="text-xs select-none"
                style={{ color: isMine ? "rgba(255,255,255,.5)" : "var(--text-muted)", lineHeight: 1 }}>
                {formatTime(message.created_at)}
              </span>
              {isMine && <Ticks read={isRead} />}
            </div>
          </div>

          {/* Incoming: reply button on hover */}
          {!isMine && (
            <button
              onClick={() => onReply?.(message)}
              onMouseDown={e => e.preventDefault()}
              className="flex-shrink-0 w-7 h-7 rounded-full items-center justify-center mb-0.5 transition-all duration-150 hidden sm:flex"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--accent-light)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Ticks({ read }) {
  const color = read ? "#a78bfa" : "rgba(255,255,255,.45)";
  if (!read) {
    return (
      <svg viewBox="0 0 10 11" style={{ width: 10, height: 10, flexShrink: 0 }}>
        <polyline points="1,5.5 4,8.5 9,3"
          fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 11" style={{ width: 15, height: 10, flexShrink: 0, transition: "stroke .4s" }}>
      <polyline points="1,5.5 4.5,9 10,3"
        fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="5,5.5 8.5,9 14,3"
        fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
