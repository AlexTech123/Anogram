import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const { lastReadMessageId } = useWebSocket();
  const isMine = message.sender_id === user?.id;
  const isRead = isMine && lastReadMessageId !== null && message.id <= lastReadMessageId;

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
    <div className={`flex mb-1 animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {/* Sender name — only for incoming */}
        {!isMine && (
          <span className="text-xs font-semibold mb-1 px-3" style={{ color: "var(--accent)" }}>
            @{message.sender_username}
          </span>
        )}

        {/* Bubble */}
        <div
          className={isMine ? "bubble-out" : "bubble-in"}
          style={{ padding: "8px 12px 6px" }}
        >
          {/* Message text */}
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{
            color: isMine ? "#fff" : "var(--text-primary)",
            paddingRight: "44px",  // space for meta
          }}>
            {message.is_deleted
              ? <em style={{ opacity: .5 }}>Message deleted</em>
              : message.content}
          </p>

          {/* Time + ticks — positioned inside bubble, bottom-right */}
          <div className="flex items-center justify-end gap-1 -mt-3 float-right ml-2" style={{ minWidth: 42 }}>
            <span className="text-xs" style={{ color: isMine ? "rgba(255,255,255,.55)" : "var(--text-muted)" }}>
              {formatTime(message.created_at)}
            </span>
            {isMine && <Ticks read={isRead} />}
          </div>

          <div className="clear-both" />
        </div>
      </div>
    </div>
  );
}

function Ticks({ read }) {
  const color = read ? "#6bc5f8" : "rgba(255,255,255,.45)";
  return (
    <svg viewBox="0 0 16 11" style={{ width: 15, height: 11, flexShrink: 0, transition: "all .3s" }}>
      <polyline points="1,5.5 4.5,9 10,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="5,5.5 8.5,9 14,3" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
