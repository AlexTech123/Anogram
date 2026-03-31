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
  const { lastEvent, onlineIds } = useGlobalWS();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [partnerLastReadId, setPartnerLastReadId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const activeChatIdRef = useRef(null);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const loadChats = useCallback(() => {
    getChats().then(r => setChats(r.data));
  }, []);

  useEffect(() => { loadChats(); }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "new_message") {
      const { chat_id, content, sender_username, created_at } = lastEvent;
      const isActive = activeChatIdRef.current === chat_id;
      setChats(prev => {
        const idx = prev.findIndex(c => c.id === chat_id);
        if (idx === -1) { loadChats(); return prev; }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          last_message: { content, sender_username, created_at },
          unread_count: isActive ? 0 : (updated[idx].unread_count || 0) + 1,
        };
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });
    }

    if (lastEvent.type === "chat_deleted") {
      const { chat_id } = lastEvent;
      setChats(prev => prev.filter(c => c.id !== chat_id));
      if (activeChatIdRef.current === chat_id) {
        setActiveChatId(null); setActiveChat(null); setShowChat(false);
      }
    }
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
    setPartnerLastReadId(data.partner_last_read_id ?? null);
    setActiveChat(data);
  };

  const handleMessagesRead = useCallback((chatId) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
  }, []);

  const handleChatDeleted = (id) => {
    setChats(prev => prev.filter(c => c.id !== id));
    setActiveChatId(null); setActiveChat(null); setShowChat(false);
  };

  const goBack = () => {
    setShowChat(false); setActiveChatId(null); setActiveChat(null);
  };

  return (
    <WebSocketProvider chatId={activeChatId} initialReadId={partnerLastReadId}>
      <AppLayout
        showChat={showChat}
        sidebar={
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            onChatCreated={chat => setChats(prev => prev.find(c => c.id === chat.id) ? prev : [chat, ...prev])}
            onDeselectChat={goBack}
            onlineIds={onlineIds}
            currentUser={user}
          />
        }
        main={
          <ChatWindow
            chat={activeChat}
            onBack={goBack}
            onChatDeleted={handleChatDeleted}
            onMessagesRead={handleMessagesRead}
            onUnreadIncrement={(chatId) =>
              setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c))
            }
          />
        }
      />
    </WebSocketProvider>
  );
}
