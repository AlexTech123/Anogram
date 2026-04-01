import { useCallback, useEffect, useRef, useState } from "react";
import { useMessages } from "../../hooks/useMessages";
import { useWebSocket } from "../../context/WebSocketContext";
import { useAuth } from "../../context/AuthContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { searchMessages as apiSearch } from "../../api/messages";

function formatDateLabel(iso) {
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { day: "numeric", month: "long", year: diff > 365 ? "numeric" : undefined });
}

function sameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
      <span className="text-xs px-3 py-1 rounded-full font-medium flex-shrink-0"
        style={{ background: "rgba(124,111,255,.1)", color: "var(--text-muted)", border: "1px solid rgba(124,111,255,.15)" }}>
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
    </div>
  );
}

export default function ChatWindow({ chat, onBack, onChatDeleted, onMessagesRead, onUnreadIncrement, onRename }) {
  const { user } = useAuth();
  const { messages: fetched, loading, newUnseenCount, setNewUnseenCount, markSeen } = useMessages(chat?.id);
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [atBottom, setAtBottom] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { sendRead, lastMessage } = useWebSocket();
  const listRef = useRef(null);
  const observerRef = useRef(null);
  const highestSeenId = useRef(null);
  const atBottomRef = useRef(true);
  const onUnreadIncrementRef = useRef(onUnreadIncrement);
  useEffect(() => { onUnreadIncrementRef.current = onUnreadIncrement; }, [onUnreadIncrement]);

  useEffect(() => { setMessages(fetched); setReplyTo(null); }, [fetched]);

  useEffect(() => {
    if (!listRef.current || !atBottom) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!listRef.current || !messages.length) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat?.id]);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "message") return;
    if (lastMessage.chat_id !== chat?.id) return;
    if (lastMessage.sender_id === user?.id) return;
    if (!atBottomRef.current) {
      setNewUnseenCount(prev => prev + 1);
      onUnreadIncrementRef.current?.(chat.id);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (!chat) return;
    highestSeenId.current = null;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let maxSeen = highestSeenId.current;
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const id = Number(e.target.dataset.messageId);
          if (!isNaN(id) && (maxSeen === null || id > maxSeen)) maxSeen = id;
        });
        if (maxSeen !== null && maxSeen !== highestSeenId.current) {
          highestSeenId.current = maxSeen;
          sendRead(maxSeen);
          onMessagesRead?.(chat.id);
        }
      },
      { root: listRef.current, threshold: 0.5 }
    );
    return () => { observerRef.current?.disconnect(); observerRef.current = null; };
  }, [chat?.id]);

  useEffect(() => { highestSeenId.current = null; }, [chat?.id]);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const bottom = scrollHeight - scrollTop - clientHeight < 80;
    setAtBottom(bottom);
    atBottomRef.current = bottom;
    if (bottom) { markSeen(); onMessagesRead?.(chat?.id); }
  }, [chat?.id]);

  const handleDeleted = (id) => setMessages(prev => prev.filter(m => m.id !== id));
  const handleEdit = (id, content) => setMessages(prev => prev.map(m =>
    m.id === id ? { ...m, content, edited_at: new Date().toISOString() } : m
  ));
  const handleContainerClick = (e) => {
    if (e.target !== listRef.current) return;
    if (window.innerWidth < 640) onBack();
  };

  // Search
  const doSearch = async (q) => {
    if (!q.trim() || !chat?.id) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await apiSearch(chat.id, q);
      setSearchResults(data);
    } finally { setSearching(false); }
  };

  // Pinned message bar
  const pinned = chat?.pinned_message;

  if (!chat) {
    return (
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-5" style={{ background: "var(--bg-base)" }}>
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,111,255,.2) 0%, transparent 70%)", filter: "blur(24px)", transform: "scale(1.6)" }} />
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
            Choose from the list or press <span className="font-bold" style={{ color: "var(--accent-light)" }}>+</span> to start a new one
          </p>
        </div>
      </div>
    );
  }

  const displayMessages = searchMode && searchQuery ? searchResults : messages;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <ChatHeader chat={chat} onBack={onBack} onChatDeleted={onChatDeleted} onRename={onRename}
        onSearchToggle={() => { setSearchMode(v => !v); setSearchQuery(""); setSearchResults([]); }} />

      {/* Search bar */}
      {searchMode && (
        <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 animate-fade-in"
          style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>
          <input className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            placeholder="Search messages…"
            autoFocus
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
          />
          {searching && <span className="text-xs" style={{ color: "var(--text-muted)" }}>…</span>}
          {searchQuery && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{searchResults.length} found</span>}
        </div>
      )}

      {/* Pinned message */}
      {pinned && !searchMode && (
        <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2 animate-fade-in"
          style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0" style={{ color: "var(--accent)" }}>
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>Pinned message</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{pinned.content || "[media]"}</p>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <div ref={listRef}
          className="h-full overflow-y-auto py-2 px-2 sm:px-4"
          style={{
            overscrollBehavior: "contain",
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 15% 15%, rgba(99,102,241,.10) 0%, transparent 55%),
              radial-gradient(ellipse 70% 70% at 85% 85%, rgba(139,92,246,.09) 0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 50% 50%, rgba(124,111,255,.04) 0%, transparent 70%)
            `,
          }}
          onScroll={handleScroll} onClick={handleContainerClick}>

          {loading && (
            <div className="flex justify-center py-10 gap-1.5 items-center">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full" style={{
                  background: "var(--accent)", opacity: .7,
                  animation: `bounce-dot 1s ease ${i*.18}s infinite`, display: "inline-block"
                }}/>
              ))}
            </div>
          )}

          {!loading && !displayMessages.length && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div style={{ fontSize: "2.5rem", filter: "drop-shadow(0 4px 12px rgba(124,111,255,.3))" }}>
                {searchMode ? "🔍" : "✉️"}
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {searchMode ? "No messages found" : "No messages yet"}
              </p>
              {!searchMode && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Say hello!</p>}
            </div>
          )}

          {displayMessages.map((msg, i) => {
            const prev = displayMessages[i - 1];
            const next = displayMessages[i + 1];
            const isDM = chat?.chat_type === "dm";
            const showSender = isDM ? false : (!prev || prev.sender_id !== msg.sender_id);
            const showDate = !searchMode && (!prev || !sameDay(prev.created_at, msg.created_at));
            // Tail only on the last bubble in a consecutive group from same sender
            const isLastInGroup = !next || next.sender_id !== msg.sender_id;
            const partnerOriginal = chat?.members?.find(m => m.user_id !== user?.id)?.user?.username;
            return (
              <div key={msg.id}>
                {showDate && <DateDivider date={msg.created_at} />}
                <MessageBubble
                  message={msg}
                  onDeleted={handleDeleted}
                  showSender={showSender}
                  isLastInGroup={isLastInGroup}
                  onReply={setReplyTo}
                  observerRef={observerRef}
                  onEdit={handleEdit}
                  resolveUsername={(username) =>
                    (chat?.partner_username && username === partnerOriginal)
                      ? chat.partner_username
                      : username
                  }
                />
              </div>
            );
          })}
          <div />
        </div>

        {!atBottom && !searchMode && (
          <button
            onClick={() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); markSeen(); }}
            className="absolute bottom-4 right-4 flex flex-col items-center justify-center gap-0.5 shadow-lg transition-all animate-fade-in active:scale-90"
            style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 16px rgba(99,102,241,.5)", borderRadius: 20, minWidth: 36, height: 36, padding: "0 8px" }}>
            {newUnseenCount > 0 && (
              <span className="text-white font-bold leading-none" style={{ fontSize: 10 }}>
                {newUnseenCount > 99 ? "99+" : newUnseenCount}
              </span>
            )}
            <svg viewBox="0 0 24 24" className="fill-white flex-shrink-0" style={{ width: 16, height: 16 }}>
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        )}
      </div>

      <MessageInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} chatId={chat?.id}
        onMediaSent={msg => setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])} />
    </div>
  );
}
