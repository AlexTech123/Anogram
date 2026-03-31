import { useRef, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import ReplyBar from "./ReplyBar";

export default function MessageInput({ replyTo, onCancelReply }) {
  const [text, setText] = useState("");
  const { sendMessage, sendTyping } = useWebSocket();
  const ref = useRef(null);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    sendMessage(content, replyTo?.id ?? null);
    setText("");
    onCancelReply?.();
    if (ref.current) { ref.current.style.height = "auto"; ref.current.focus(); }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") onCancelReply?.();
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
    <div className="flex-shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />
      <div className="flex items-end gap-2.5 px-3 py-2.5"
        style={{ background: "var(--bg-sidebar)", borderTop: replyTo ? "none" : "1px solid var(--border)" }}>
        <div
          className="flex-1 flex items-end rounded-2xl px-3 py-2 transition-all duration-200"
          style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,111,255,.12)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <textarea
            ref={ref}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
            style={{ color: "var(--text-primary)", minHeight: 22, maxHeight: 120 }}
            placeholder="Message…"
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
          onMouseDown={e => e.preventDefault()}
          className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90"
          style={hasText
            ? { background: "var(--accent-gradient)", boxShadow: "0 4px 16px rgba(99,102,241,.5)" }
            : { background: "var(--bg-elevated)", opacity: .35 }
          }
          onMouseEnter={e => { if (hasText) e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" style={{ transform: "translateX(1px)" }}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
