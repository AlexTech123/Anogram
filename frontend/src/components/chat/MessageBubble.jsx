import { useAuth } from "../../context/AuthContext";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;

  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-3">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1 animate-fade-up`}>
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[70%]`}>
        {!isMine && (
          <span className="text-xs font-medium mb-1 px-1" style={{ color: "var(--accent-hover)" }}>
            {message.sender_username}
          </span>
        )}
        <div
          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
          style={
            isMine
              ? {
                  background: "var(--msg-mine)",
                  color: "#fff",
                  borderBottomRightRadius: "4px",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                }
              : {
                  background: "var(--msg-other)",
                  color: "var(--text-primary)",
                  borderBottomLeftRadius: "4px",
                  border: "1px solid var(--border)",
                }
          }
        >
          {message.is_deleted ? (
            <em style={{ color: isMine ? "rgba(255,255,255,0.5)" : "var(--text-muted)", fontStyle: "italic" }}>
              Message deleted
            </em>
          ) : (
            message.content
          )}
        </div>
        <span className="text-xs mt-1 px-1" style={{ color: "var(--text-muted)" }}>
          {formatTime(message.created_at)}
          {isMine && <span className="ml-1.5" style={{ color: "var(--accent-hover)" }}>✓</span>}
        </span>
      </div>
    </div>
  );
}
