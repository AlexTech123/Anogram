import { useEffect, useRef, useState } from "react";
import { useMessages } from "../../hooks/useMessages";
import { useWebSocket } from "../../context/WebSocketContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function formatDateLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { day: "numeric", month: "long", year: diff > 365 ? "numeric" : undefined });
}

function sameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      <span className="text-xs px-3 py-1 rounded-full font-medium flex-shrink-0"
        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

export default function ChatWindow({ chat, onBack, onChatDeleted }) {
  const { messages: fetched, loading } = useMessages(chat?.id);
  const [messages, setMessages] = useState([]);
  const { sendRead } = useWebSocket();
  const listRef = useRef(null);

  useEffect(() => { setMessages(fetched); }, [fetched]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    sendRead(messages[messages.length - 1].id);
  }, [messages]);

  const handleDeleted = (id) => setMessages(prev => prev.filter(m => m.id !== id));

  const handleBackgroundTap = (e) => {
    if (e.target === listRef.current) onBack();
  };

  if (!chat) {
    return (
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-5"
        style={{ background: "var(--bg-base)" }}>
        {/* Floating orb decoration */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: "radial-gradient(circle, rgba(124,111,255,.2) 0%, transparent 70%)", filter: "blur(20px)", transform: "scale(1.5)" }} />
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
            style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current" style={{ color: "var(--accent)", opacity: .6 }}>
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Select a chat</p>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
            Choose from the list or press{" "}
            <span className="font-bold" style={{ color: "var(--accent-light)" }}>+</span>
            {" "}to start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <ChatHeader chat={chat} onBack={onBack} onChatDeleted={onChatDeleted} />

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-2 px-2 sm:px-4"
        style={{ overscrollBehavior: "contain" }}
        onClick={handleBackgroundTap}
      >
        {loading && (
          <div className="flex justify-center py-10 gap-1.5 items-center">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full" style={{
                background: "var(--accent)", opacity: .7,
                animation: `bounce-dot 1s ease ${i*.18}s infinite`,
                display: "inline-block",
              }}/>
            ))}
          </div>
        )}

        {!loading && !messages.length && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(124,111,255,.3))" }}>✉️</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No messages yet</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showSender = !prev || prev.sender_id !== msg.sender_id;
          const showDate = !prev || !sameDay(prev.created_at, msg.created_at);
          return (
            <div key={msg.id}>
              {showDate && <DateDivider date={msg.created_at} />}
              <MessageBubble
                message={msg}
                onDeleted={handleDeleted}
                showSender={showSender && !showDate ? true : showSender}
              />
            </div>
          );
        })}
        <div />
      </div>

      <MessageInput />
    </div>
  );
}
