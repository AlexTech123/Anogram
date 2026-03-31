import { useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";

export default function MessageInput() {
  const [text, setText] = useState("");
  const { sendMessage } = useWebSocket();

  const send = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="px-5 py-4 flex-shrink-0" style={{ background: "var(--bg-sidebar)", borderTop: "1px solid var(--border)" }}>
      <div
        className="flex items-end gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
        style={{ background: "var(--bg-input)", border: "1.5px solid var(--border)" }}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <textarea
          className="flex-1 bg-transparent text-sm resize-none outline-none max-h-32"
          style={{ color: "var(--text-primary)" }}
          placeholder="Write a message…"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
          style={
            text.trim()
              ? {
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
                  transform: "scale(1)",
                }
              : { background: "var(--bg-elevated)", opacity: 0.4 }
          }
          onMouseEnter={e => { if (text.trim()) e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <p className="text-xs mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
