import { useRef, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";

export default function MessageInput() {
  const [text, setText] = useState("");
  const { sendMessage, sendTyping } = useWebSocket();
  const ref = useRef(null);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    sendMessage(content);
    setText("");
    if (ref.current) {
      ref.current.style.height = "auto";
      // Keep focus so keyboard stays open on mobile
      ref.current.focus();
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    if (e.target.value.trim()) sendTyping();
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="flex-shrink-0 flex items-end gap-2 px-3 py-2"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}>
      <div className="flex-1 flex items-end rounded-2xl px-3 py-2"
        style={{ background: "var(--bg-elevated)", minHeight: 40 }}>
        <textarea
          ref={ref}
          className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
          style={{ color: "var(--text-primary)", minHeight: 24, maxHeight: 120 }}
          placeholder="Message"
          rows={1}
          value={text}
          onInput={onInput}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
        />
      </div>
      <button
        onClick={send}
        disabled={!hasText}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90"
        style={hasText
          ? { background: "var(--accent)", boxShadow: "0 2px 12px rgba(42,171,238,.4)" }
          : { background: "var(--bg-elevated)", opacity: .4 }
        }
        // prevent button from stealing focus from textarea
        onMouseDown={e => e.preventDefault()}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" style={{ transform: "translateX(1px)" }}>
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  );
}
