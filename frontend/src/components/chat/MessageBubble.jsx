import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage } from "../../api/messages";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, onDeleted, showSender }) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hideTimer = useRef(null);

  const isMine = message.sender_id === user?.id;
  const isRead = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;

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
    <div className={`flex ${showSender ? "mt-3" : "mt-0.5"} animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] sm:max-w-[62%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {/* Sender name — only for first in a group, only for others */}
        {!isMine && showSender && (
          <span className="text-xs font-semibold mb-1 px-3" style={{ color: "var(--accent-light)" }}>
            @{message.sender_username}
          </span>
        )}

        <div className="flex items-end gap-2">
          {isMine && (
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
          )}

          <div
            className={isMine ? "bubble-out" : "bubble-in"}
            style={{ padding: "8px 12px 6px 12px", cursor: isMine ? "pointer" : "default" }}
            onClick={handleBubbleTap}
          >
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
        </div>
      </div>
    </div>
  );
}

function Ticks({ read }) {
  const color = read ? "#a78bfa" : "rgba(255,255,255,.45)";
  return (
    <svg viewBox="0 0 16 11" style={{ width: 15, height: 10, flexShrink: 0, transition: "stroke .4s" }}>
      <polyline points="1,5.5 4.5,9 10,3"  fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="5,5.5 8.5,9 14,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
