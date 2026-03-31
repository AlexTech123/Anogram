import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    getChats().then(r => setChats(r.data));
  }, []);

  // Global WS: update sidebar on new message
  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "new_message") return;
    const { chat_id, content, sender_username, created_at } = lastEvent;
    const isActive = activeChatIdRef.current === chat_id;

    setChats(prev => {
      const updated = prev.map(c => {
        if (c.id !== chat_id) return c;
        return {
          ...c,
          last_message: { content, sender_username, created_at },
          // Only increment unread if this chat isn't currently open
          unread_count: isActive ? 0 : (c.unread_count || 0) + 1,
        };
      });
      // Bubble to top
      const idx = updated.findIndex(c => c.id === chat_id);
      if (idx > 0) {
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
      }
      return [...updated];
    });
  }, [lastEvent]);

  const selectChat = async (id) => {
    setActiveChatId(id);
    setShowChat(true);

    // Clear unread immediately on open
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));

    const { data } = await getChat(id);
    if (data.chat_type === "dm") {
      const other = data.members?.find(m => m.user_id !== user?.id);
      data.name = other?.user?.username || "Direct Message";
    }
    setActiveChat(data);
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
        main={<ChatWindow chat={activeChat} onBack={goBack} />}
      />
    </WebSocketProvider>
  );
}
