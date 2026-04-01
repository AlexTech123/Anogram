import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage } from "../../api/messages";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const SHOW_MS = 2000;

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

  // Mine: tap1 → reply, tap2 → delete, tap3 → hide
  // Other: tap → reply
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
    setShowReply(false); clearTimeout(replyTimer.current);
  };

  // Swipe left → reply
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
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

  const ActionBtn = ({ show, onClick, children, color, shadow }) => (
    <button
      onClick={onClick}
      onMouseDown={e => e.preventDefault()}
      // On mobile, touchend fires before click — stop propagation so
      // the parent's swipe handler doesn't consume the event, then
      // fire onClick manually so the action actually runs.
      onTouchEnd={e => { e.stopPropagation(); onClick(e); }}
      className="flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200"
      style={{
        width: 28, height: 28,
        background: color,
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.5)",
        pointerEvents: show ? "auto" : "none",
        boxShadow: show ? shadow : "none",
        alignSelf: "center",
      }}
    >
      {children}
    </button>
  );

  const ReplyIcon = () => (
    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "white" }}>
      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
    </svg>
  );

  const DeleteIcon = () => deleting ? (
    <svg style={{ width: 13, height: 13, animation: "spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" strokeOpacity=".3"/>
      <path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "white" }}>
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  );

  return (
    <div
      ref={bubbleRef}
      data-message-id={message.id}
      className={`flex ${showSender ? "mt-4" : "mt-1.5"} animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}
      style={{
        transform: swipeX ? `translateX(${swipeX * 0.45}px)` : undefined,
        transition: swiping ? "none" : "transform .2s ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] sm:max-w-[62%]`}>
        {!isMine && showSender && (
          <span className="text-xs font-semibold mb-1 px-3" style={{ color: "var(--accent-light)" }}>
            @{message.sender_username}
          </span>
        )}

        <div className="flex items-center gap-1.5">
          {/*
            Mine:   fixed-slot (reply+delete stacked) | bubble
            Other:  bubble | fixed-slot (reply)
          */}

          {/* LEFT slot for mine — fixed 28px, buttons stacked.
              Wrapper pointerEvents follows visibility so the hidden one
              never intercepts clicks meant for the visible one. */}
          {isMine && (
            <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0, alignSelf: "center" }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: showDelete ? "auto" : "none" }}>
                <ActionBtn show={showDelete} onClick={handleDelete}
                  color="rgba(239,68,68,.85)" shadow="0 2px 10px rgba(239,68,68,.4)">
                  <DeleteIcon />
                </ActionBtn>
              </div>
              <div style={{ position: "absolute", inset: 0, pointerEvents: showReply ? "auto" : "none" }}>
                <ActionBtn show={showReply} onClick={handleReplyClick}
                  color="rgba(124,111,255,.85)" shadow="0 2px 10px rgba(124,111,255,.5)">
                  <ReplyIcon />
                </ActionBtn>
              </div>
            </div>
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

            {/* Media */}
            {message.media_url && <MediaPreview msg={message} />}

            {message.content && (
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                style={{ color: isMine ? "#fff" : "var(--text-primary)" }}>
                {message.content}
              </p>
            )}

            <div className="flex items-center justify-end gap-1.5" style={{ marginTop: 4 }}>
              <span className="text-xs select-none"
                style={{ color: isMine ? "rgba(255,255,255,.5)" : "var(--text-muted)", lineHeight: 1 }}>
                {formatTime(message.created_at)}
              </span>
              {isMine && <Ticks read={isRead} />}
            </div>
          </div>

          {/* RIGHT slot for others */}
          {!isMine && (
            <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0, alignSelf: "center" }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <ActionBtn show={showReply} onClick={handleReplyClick}
                  color="rgba(124,111,255,.85)" shadow="0 2px 10px rgba(124,111,255,.5)">
                  <ReplyIcon />
                </ActionBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaPreview({ msg }) {
  const url = msg.media_url;
  if (msg.message_type === "voice") {
    return (
      <div className="mb-1.5" onClick={e => e.stopPropagation()}>
        <audio controls src={url} preload="metadata"
          style={{ height: 36, maxWidth: 220, borderRadius: 12 }} />
      </div>
    );
  }
  if (msg.message_type === "image") {
    return (
      <img src={url} alt="" loading="lazy"
        className="rounded-xl mb-1.5 max-w-full cursor-pointer"
        style={{ maxHeight: 260, objectFit: "cover" }}
        onClick={e => { e.stopPropagation(); window.open(url, "_blank"); }} />
    );
  }
  if (msg.message_type === "video") {
    return (
      <div className="mb-1.5" onClick={e => e.stopPropagation()}>
        <video controls src={url} preload="metadata"
          className="rounded-xl max-w-full" style={{ maxHeight: 260 }} />
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
