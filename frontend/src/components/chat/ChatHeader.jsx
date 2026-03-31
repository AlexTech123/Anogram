import { Avatar } from "../sidebar/Sidebar";

export default function ChatHeader({ chat }) {
  if (!chat) return null;
  const name = chat.name || (chat.chat_type === "dm" ? "Direct Message" : "Group");
  const memberCount = chat.members?.length;

  return (
    <div
      className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0"
      style={{
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Avatar name={name} size={9} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{name}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {chat.chat_type === "dm" ? "Direct message" : `${memberCount ?? ""} members`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: "var(--online)", boxShadow: "0 0 6px var(--online)" }} />
        <span className="text-xs" style={{ color: "var(--online)" }}>Online</span>
      </div>
    </div>
  );
}
