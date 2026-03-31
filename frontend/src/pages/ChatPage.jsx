import { useCallback, useEffect, useRef, useState } from "react";
import { getChat, getChats } from "../api/chats";
import AppLayout from "../components/layout/AppLayout";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { WebSocketProvider } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { useGlobalWS } from "../context/GlobalWSContext";

export default function ChatPage() {
  const { user } = useAuth();
  const { lastEvent } = useGlobalWS();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const activeChatIdRef = useRef(null);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const loadChats = useCallback(() => {
    getChats().then(r => setChats(r.data));
  }, []);

  useEffect(() => { loadChats(); }, []);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "new_message") return;
    const { chat_id, content, sender_username, created_at } = lastEvent;
    const isActive = activeChatIdRef.current === chat_id;

    setChats(prev => {
      const exists = prev.find(c => c.id === chat_id);
      if (!exists) { loadChats(); return prev; }
      const updated = prev.map(c => c.id !== chat_id ? c : {
        ...c,
        last_message: { content, sender_username, created_at },
        unread_count: isActive ? 0 : (c.unread_count || 0) + 1,
      });
      const idx = updated.findIndex(c => c.id === chat_id);
      if (idx > 0) { const [m] = updated.splice(idx, 1); updated.unshift(m); }
      return [...updated];
    });
  }, [lastEvent]);

  const selectChat = async (id) => {
    setActiveChatId(id);
    setShowChat(true);
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
    const { data } = await getChat(id);
    if (data.chat_type === "dm") {
      const other = data.members?.find(m => m.user_id !== user?.id);
      data.name = other?.user?.username || "Direct Message";
    }
    setActiveChat(data);
  };

  const handleChatDeleted = (id) => {
    setChats(prev => prev.filter(c => c.id !== id));
    setActiveChatId(null);
    setActiveChat(null);
    setShowChat(false);
  };

  const goBack = () => {
    setShowChat(false);
    setActiveChatId(null);
    setActiveChat(null);
  };

  const handleChatCreated = (chat) => {
    setChats(prev => prev.find(c => c.id === chat.id) ? prev : [chat, ...prev]);
  };

  return (
    <WebSocketProvider chatId={activeChatId}>
      <AppLayout
        showChat={showChat}
        sidebar={
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            onChatCreated={handleChatCreated}
            currentUser={user}
          />
        }
        main={
          <ChatWindow
            chat={activeChat}
            onBack={goBack}
            onChatDeleted={handleChatDeleted}
          />
        }
      />
    </WebSocketProvider>
  );
}
