import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { deleteMessage } from "../../api/messages";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, onDeleted }) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const longPressTimer = useRef(null);

  const isMine = message.sender_id === user?.id;
  const isRead = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMessage(message.id);
      onDeleted(message.id);
    } catch {
      setDeleting(false);
      setShowActions(false);
    }
  };

  // Long press for touch devices
  const onTouchStart = () => {
    if (!isMine) return;
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };
  const onTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs px-3 py-1 rounded-full"
          style={{ background: "rgba(42,171,238,.15)", color: "var(--text-secondary)" }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex mb-0.5 animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}
        onMouseEnter={() => { if (isMine) setShowActions(true); }}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchEnd}
      >
        <div className={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          {!isMine && (
            <span className="text-xs font-semibold mb-1 px-3" style={{ color: "var(--accent)" }}>
              @{message.sender_username}
            </span>
          )}

          <div className="flex items-end gap-1.5">
            {/* Delete button — only mine, left of bubble */}
            {isMine && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all mb-1"
                style={{
                  background: "rgba(229,57,53,.8)",
                  opacity: showActions ? 1 : 0,
                  pointerEvents: showActions ? "auto" : "none",
                  transform: showActions ? "scale(1)" : "scale(0.6)",
                  transition: "opacity .15s, transform .15s",
                }}
                // prevent textarea losing focus on desktop
                onMouseDown={e => e.preventDefault()}
                title="Delete message"
              >
                {deleting
                  ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" strokeOpacity=".3"/>
                      <path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  : <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                }
              </button>
            )}

            <div className={isMine ? "bubble-out" : "bubble-in"} style={{ padding: "7px 10px 5px 12px" }}>
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                style={{ color: isMine ? "#fff" : "var(--text-primary)" }}>
                {message.content}
              </p>
              <div className="flex items-center justify-end gap-1" style={{ marginTop: 3 }}>
                <span className="text-xs select-none"
                  style={{ color: isMine ? "rgba(255,255,255,.55)" : "var(--text-muted)", lineHeight: 1 }}>
                  {formatTime(message.created_at)}
                </span>
                {isMine && <Ticks read={isRead} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile action sheet — appears after long press */}
      {showActions && isMine && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:hidden animate-fade-in"
          style={{ background: "rgba(0,0,0,.5)" }}
          onClick={() => setShowActions(false)}
        >
          <div className="w-full animate-pop" style={{
            background: "var(--bg-card)",
            borderRadius: "16px 16px 0 0",
            padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
          }}>
            <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--bg-elevated)" }} />
            <button
              onClick={e => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors text-sm font-medium"
              style={{ background: "rgba(229,57,53,.12)", color: "#ef5350" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              {deleting ? "Deleting…" : "Delete message"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Ticks({ read }) {
  const color = read ? "#6bc5f8" : "rgba(255,255,255,.5)";
  return (
    <svg viewBox="0 0 16 11" style={{ width: 15, height: 10, flexShrink: 0, transition: "stroke .3s" }}>
      <polyline points="1,5.5 4.5,9 10,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="5,5.5 8.5,9 14,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
