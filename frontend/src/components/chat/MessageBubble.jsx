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
    <div className={`flex mb-0.5 animate-msg-in ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && (
          <span className="text-xs font-semibold mb-1 px-3" style={{ color: "var(--accent)" }}>
            @{message.sender_username}
          </span>
        )}

        <div className={isMine ? "bubble-out" : "bubble-in"} style={{ padding: "7px 10px 5px 12px" }}>
          {/* Text */}
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
            style={{ color: isMine ? "#fff" : "var(--text-primary)" }}>
            {message.is_deleted
              ? <em style={{ opacity: .5 }}>Message deleted</em>
              : message.content}
          </p>

          {/* Meta — sits on its own line below text, right-aligned */}
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
  );
}

function Ticks({ read }) {
  const color = read ? "#6bc5f8" : "rgba(255,255,255,.5)";
  return (
    <svg viewBox="0 0 16 11" style={{ width: 15, height: 10, flexShrink: 0, transition: "fill .3s, stroke .3s" }}>
      <polyline points="1,5.5 4.5,9 10,3"
        fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="5,5.5 8.5,9 14,3"
        fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
