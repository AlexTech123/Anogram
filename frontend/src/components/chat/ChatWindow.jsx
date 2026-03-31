import { useEffect, useRef } from "react";
import { useMessages } from "../../hooks/useMessages";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

export default function ChatWindow({ chat, onBack }) {
  const { messages, loading } = useMessages(chat?.id);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chat) {
    return (
      <div
        className="hidden sm:flex flex-1 flex-col items-center justify-center gap-5"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          💬
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Select a chat</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Choose a conversation or start a new one
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Press
          <kbd
            className="px-2 py-0.5 rounded text-xs font-mono font-bold"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            +
          </kbd>
          to start a chat
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      <ChatHeader chat={chat} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s`, opacity: 0.6 }}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              ✉️
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput />
    </div>
  );
}
