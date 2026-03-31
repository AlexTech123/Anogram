import { Avatar } from "../sidebar/Sidebar";

export default function ChatHeader({ chat, onBack }) {
  if (!chat) return null;
  const name = chat.name || "Direct Message";
  const memberCount = chat.members?.length;

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
      style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Back button — mobile only */}
      <button
        onClick={onBack}
        className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      <Avatar name={name} size={9} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--online)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {chat.chat_type === "dm" ? "Direct message" : `${memberCount ?? ""} members`}
          </p>
        </div>
      </div>
    </div>
  );
}
