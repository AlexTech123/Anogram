import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage } from "../../api/messages";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const SHOW_MS = 3000;

export default function MessageBubble({ message, onDeleted, showSender, onReply, observerRef }) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();

  const [showDelete, setShowDelete] = useState(false);
  const [showReply,  setShowReply]  = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [swipeX,     setSwipeX]     = useState(0);
  const [swiping,    setSwiping]    = useState(false);

  const deleteTimer = useRef(null);
  const replyTimer  = useRef(null);
  const touch       = useRef(null);
  const bubbleRef   = useRef(null);

  const isMine = message.sender_id === user?.id;
  const isRead = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el || !observerRef?.current) return;
    observerRef.current.observe(el);
    return () => observerRef.current?.unobserve(el);
  }, [observerRef]);

  const armDelete = () => {
    clearTimeout(deleteTimer.current);
    setShowDelete(true);
    deleteTimer.current = setTimeout(() => setShowDelete(false), SHOW_MS);
  };

  const armReply = () => {
    clearTimeout(replyTimer.current);
    setShowReply(true);
    replyTimer.current = setTimeout(() => setShowReply(false), SHOW_MS);
  };

  // Tap bubble:
  // - own:   1st tap → delete, 2nd tap → reply, 3rd → hide
  // - other: tap → reply
  const handleBubbleClick = () => {
    if (isMine) {
      if (!showReply && !showDelete) { armReply(); return; }
      if (showReply) { setShowReply(false); clearTimeout(replyTimer.current); armDelete(); return; }
      setShowDelete(false); clearTimeout(deleteTimer.current);
    } else {
      armReply();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    clearTimeout(deleteTimer.current);
    try { await deleteMessage(message.id); onDeleted(message.id); }
    catch { setDeleting(false); setShowDelete(false); }
  };

  const handleReplyClick = (e) => {
    e.stopPropagation();
    onReply?.(message);
    setShowReply(false);
    clearTimeout(replyTimer.current);
  };

  // Swipe left → reply
  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e) => {
    if (!touch.current) return;
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = Math.abs(e.touches[0].clientY - touch.current.y);
    if (dy > 20) { setSwiping(false); setSwipeX(0); return; }
    if (dx < 0 && dx > -80) { setSwiping(true); setSwipeX(dx); }
  };
  const onTouchEnd = () => {
    if (swipeX < -50) onReply?.(message);
    setSwipeX(0); setSwiping(false); touch.current = null;
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

  const ReplyBtn = ({ onClick, show }) => (
    <button
      onClick={onClick}
      onMouseDown={e => e.preventDefault()}
      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
      style={{
        background: "rgba(124,111,255,.85)",
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.5)",
        pointerEvents: show ? "auto" : "none",
        boxShadow: show ? "0 2px 10px rgba(124,111,255,.5)" : "none",
        alignSelf: "center",
      }}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
      </svg>
    </button>
  );

  const DeleteBtn = ({ onClick, show }) => (
    <button
      onClick={onClick}
      onMouseDown={e => e.preventDefault()}
      disabled={deleting}
      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
      style={{
        background: "rgba(239,68,68,.85)",
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.5)",
        pointerEvents: show ? "auto" : "none",
        boxShadow: show ? "0 2px 10px rgba(239,68,68,.4)" : "none",
        alignSelf: "center",
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
  );

  return (
    <div
      ref={bubbleRef}
      data-message-id={message.id}
      className={`flex ${showSender ? "mt-3" : "mt-0.5"} animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}
      style={{
        transform: swipeX ? `translateX(${swipeX * 0.45}px)` : undefined,
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

        <div className="flex items-center gap-2">
          {/* Left buttons for own messages: reply */}
          {isMine && (
            <ReplyBtn onClick={handleReplyClick} show={showReply} />
          )}

          {/* Bubble */}
          <div
            className={isMine ? "bubble-out" : "bubble-in"}
            style={{ padding: "8px 12px 6px 12px", cursor: "pointer" }}
            onClick={handleBubbleClick}
          >
            {message.reply_to && (
              <div className="rounded-xl px-3 py-2 mb-2 text-xs"
                style={{
                  background: isMine ? "rgba(0,0,0,.2)" : "var(--bg-elevated)",
                  borderLeft: `3px solid ${isMine ? "rgba(255,255,255,.4)" : "var(--accent)"}`,
                }}>
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

          {/* Right buttons */}
          {/* Own message: show delete (from tap), reply shown on left */}
          {isMine && (
            <DeleteBtn onClick={handleDelete} show={showDelete} />
          )}
          {/* Other's message: reply button on right */}
          {!isMine && (
            <ReplyBtn onClick={handleReplyClick} show={showReply} />
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
