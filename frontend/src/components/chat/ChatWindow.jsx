import { useEffect, useRef, useState } from "react";
import { useMessages } from "../../hooks/useMessages";
import { useWebSocket } from "../../context/WebSocketContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

export default function ChatWindow({ chat, onBack, onChatDeleted }) {
  const { messages: fetched, loading } = useMessages(chat?.id);
  const [messages, setMessages] = useState([]);
  const { sendRead } = useWebSocket();
  const listRef = useRef(null);

  // Sync fetched messages into local state
  useEffect(() => { setMessages(fetched); }, [fetched]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    sendRead(messages[messages.length - 1].id);
  }, [messages]);

  const handleDeleted = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  if (!chat) {
    return (
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-4"
        style={{ background: "var(--bg-base)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-sidebar)" }}>
          <svg viewBox="0 0 24 24" className="w-12 h-12 opacity-30 fill-current"
            style={{ color: "var(--text-secondary)" }}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No chat selected</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Pick a conversation or press + to start one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <ChatHeader chat={chat} onBack={onBack} onChatDeleted={onChatDeleted} />

      <div ref={listRef} className="flex-1 overflow-y-auto py-3 px-2 sm:px-4"
        style={{ overscrollBehavior: "contain" }}>
        {loading && (
          <div className="flex justify-center py-8 gap-1.5 items-center">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full" style={{
                background: "var(--accent)", opacity: .7,
                animation: `bounce-dot 1s ease ${i*.18}s infinite`,
                display: "inline-block"
              }}/>
            ))}
          </div>
        )}

        {!loading && !messages.length && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <span style={{ fontSize: "2.5rem" }}>👋</span>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No messages yet</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Be the first to say something!</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onDeleted={handleDeleted} />
        ))}
        <div />
      </div>

      <MessageInput />
    </div>
  );
}
