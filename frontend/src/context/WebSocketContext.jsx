import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const WSContext = createContext(null);

export function WebSocketProvider({ chatId, initialReadId, children }) {
  const wsRef = useRef(null);
  const [lastMessage, setLastMessage]             = useState(null);
  const [typingUsers, setTypingUsers]             = useState({});
  const [onlineUserIds, setOnlineUserIds]         = useState(new Set());
  // Initialise from server so double-tick persists across sessions
  const [lastReadMessageId, setLastReadMessageId] = useState(initialReadId ?? null);

  const typingTimers   = useRef({});
  const typingThrottle = useRef(null);

  // When initialReadId changes (new chat opened), reset
  useEffect(() => {
    setLastReadMessageId(initialReadId ?? null);
  }, [chatId, initialReadId]);

  useEffect(() => {
    if (!chatId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setTypingUsers({});
    setOnlineUserIds(new Set());
    Object.values(typingTimers.current).forEach(clearTimeout);
    typingTimers.current = {};

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/${chatId}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = ({ data }) => { try { dispatch(JSON.parse(data)); } catch {} };
    ws.onerror = e => console.error("WS error", e);

    // Keep-alive ping every 25s
    let pingId = null;
    ws.onopen = () => {
      pingId = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25_000);
    };

    return () => {
      clearInterval(pingId);
      ws.close();
      wsRef.current = null;
      if (typingThrottle.current) clearTimeout(typingThrottle.current);
    };
  }, [chatId]);

  const dispatch = (data) => {
    switch (data.type) {
      case "message":
        setLastMessage(data);
        break;
      case "typing": {
        const uid = String(data.user_id);
        if (typingTimers.current[uid]) clearTimeout(typingTimers.current[uid]);
        setTypingUsers(prev => ({ ...prev, [uid]: data.username }));
        typingTimers.current[uid] = setTimeout(() => {
          setTypingUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
          delete typingTimers.current[uid];
        }, 3000);
        break;
      }
      case "online_status":
        setOnlineUserIds(new Set(data.online_user_ids));
        break;
      case "user_online":
        setOnlineUserIds(prev => new Set([...prev, data.user_id]));
        break;
      case "user_offline":
        setOnlineUserIds(prev => { const n = new Set(prev); n.delete(data.user_id); return n; });
        break;
      case "read_receipt":
        // Always advance — never go backwards
        setLastReadMessageId(prev =>
          prev === null || data.message_id > prev ? data.message_id : prev
        );
        break;
    }
  };

  const raw = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(payload));
  };

  const sendMessage = useCallback((content, replyToId = null) => {
    raw({ type: "message", content, ...(replyToId ? { reply_to_id: replyToId } : {}) });
  }, []);

  const sendTyping = useCallback(() => {
    if (typingThrottle.current) return;
    raw({ type: "typing" });
    typingThrottle.current = setTimeout(() => { typingThrottle.current = null; }, 1500);
  }, []);

  const sendRead = useCallback((messageId) => {
    if (messageId) raw({ type: "read", message_id: messageId });
  }, []);

  return (
    <WSContext.Provider value={{
      sendMessage, sendTyping, sendRead,
      lastMessage, typingUsers, onlineUserIds, lastReadMessageId,
    }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWebSocket = () => useContext(WSContext);
