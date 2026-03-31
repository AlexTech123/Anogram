import { useCallback, useEffect, useRef, useState } from "react";
import { getChat, getChats } from "../api/chats";
import AppLayout from "../components/layout/AppLayout";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { WebSocketProvider } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { useGlobalWS } from "../context/GlobalWSContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import PushPrompt from "../components/PushPrompt";

export default function ChatPage() {
  const { user } = useAuth();
  const { lastEvent } = useGlobalWS();
  const push = usePushNotifications();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const activeChatIdRef = useRef(null);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const loadChats = useCallback(() => {
    getChats().then(r => setChats(r.data));
  }, []);

  useEffect(() => { loadChats(); }, []);

  // Show push prompt once if supported and not yet decided
  useEffect(() => {
    if (push.supported && push.permission === "default" && !push.subscribed) {
      const timer = setTimeout(() => setShowPushPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [push.supported, push.permission, push.subscribed]);

  // Handle global WS events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "new_message") {
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
    }

    if (lastEvent.type === "chat_deleted") {
      const { chat_id } = lastEvent;
      setChats(prev => prev.filter(c => c.id !== chat_id));
      if (activeChatIdRef.current === chat_id) {
        setActiveChatId(null);
        setActiveChat(null);
        setShowChat(false);
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

  return (
    <WebSocketProvider chatId={activeChatId}>
      <AppLayout
        showChat={showChat}
        sidebar={
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            onChatCreated={(chat) => setChats(prev => prev.find(c => c.id === chat.id) ? prev : [chat, ...prev])}
            push={push}
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
      {showPushPrompt && (
        <PushPrompt
          onAllow={async () => { await push.requestAndSubscribe(); setShowPushPrompt(false); }}
          onDismiss={() => setShowPushPrompt(false)}
        />
      )}
    </WebSocketProvider>
  );
}
