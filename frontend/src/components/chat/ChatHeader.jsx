import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { Avatar } from "../sidebar/Sidebar";

export default function ChatHeader({ chat, onBack }) {
  const { user } = useAuth();
  const { onlineUserIds, typingUsers } = useWebSocket();

  if (!chat) return null;

  const name = chat.name || "Direct Message";
  const other = chat.members?.find(m => m.user_id !== user?.id);
  const isOnline = other ? onlineUserIds.has(other.user_id) : false;
  const typingList = Object.values(typingUsers);
  const subtitle = typingList.length
    ? null  // handled separately below
    : isOnline ? "online" : "offline";

  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-3"
      style={{ height: 56, background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Back — mobile */}
      <button onClick={onBack}
        className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors active:scale-90"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>

      <Avatar name={name} size={9} online={isOnline} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
        {typingList.length > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--accent)" }}>typing</span>
            <span className="flex gap-0.5 items-center">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full" style={{
                  background: "var(--accent)",
                  animation: `bounce-dot .9s ease ${i*.18}s infinite`,
                  display: "inline-block"
                }}/>
              ))}
            </span>
          </div>
        ) : (
          <p className="text-xs transition-colors duration-300"
            style={{ color: isOnline ? "var(--online)" : "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
