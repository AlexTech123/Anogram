import { useEffect, useState } from "react";
import { getChat, getChats } from "../api/chats";
import AppLayout from "../components/layout/AppLayout";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { WebSocketProvider } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false); // mobile: show chat pane

  useEffect(() => {
    getChats().then((r) => setChats(r.data));
  }, []);

  const selectChat = async (id) => {
    setActiveChatId(id);
    setShowChat(true);
    const { data } = await getChat(id);
    if (data.chat_type === "dm") {
      const other = data.members?.find((m) => m.user_id !== user?.id);
      data.name = other?.user?.display_name || other?.user?.username || "Direct Message";
    }
    setActiveChat(data);
  };

  const goBack = () => {
    setShowChat(false);
    setActiveChatId(null);
    setActiveChat(null);
  };

  const handleChatCreated = (chat) => {
    setChats((prev) => prev.find((c) => c.id === chat.id) ? prev : [chat, ...prev]);
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
          />
        }
        main={
          <ChatWindow chat={activeChat} onBack={goBack} />
        }
      />
    </WebSocketProvider>
  );
}
