import { Avatar } from "./Sidebar";

export default function ChatList({ chats, activeChatId, onSelect }) {
  if (!chats.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "var(--bg-elevated)" }}
        >
          💬
        </div>
        <p className="text-sm text-center font-medium" style={{ color: "var(--text-secondary)" }}>No chats yet</p>
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Press + to start a conversation
        </p>
      </div>
    );
  }

  return (
    <ul className="px-2 flex flex-col gap-0.5">
      {chats.map((chat) => {
        const name = chat.name || (chat.chat_type === "dm" ? "Direct Message" : "Group");
        const isActive = chat.id === activeChatId;
        return (
          <li key={chat.id} className="animate-slide-in">
            <button
              onClick={() => onSelect(chat.id)}
              className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 group"
              style={{
                background: isActive ? "var(--bg-hover)" : "transparent",
                borderLeft: isActive ? "2.5px solid var(--accent)" : "2.5px solid transparent",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Avatar name={name} size={9} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {chat.chat_type === "dm" ? "Direct message" : "Group chat"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
