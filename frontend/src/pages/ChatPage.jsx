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

  useEffect(() => {
    getChats().then((r) => setChats(r.data));
  }, []);

  const selectChat = async (id) => {
    setActiveChatId(id);
    const { data } = await getChat(id);
    // For DMs, use the other user's name
    if (data.chat_type === "dm") {
      const other = data.members?.find((m) => m.user_id !== user?.id);
      data.name = other?.user?.display_name || other?.user?.username || "Direct Message";
    }
    setActiveChat(data);
  };

  const handleChatCreated = (chat) => {
    setChats((prev) => {
      if (prev.find((c) => c.id === chat.id)) return prev;
      return [chat, ...prev];
    });
  };

  // Compute display names for DMs in sidebar
  const displayChats = chats.map((c) => {
    if (c.chat_type === "dm" && !c.name) {
      return { ...c, name: "Direct Message" };
    }
    return c;
  });

  return (
    <WebSocketProvider chatId={activeChatId}>
      <AppLayout
        sidebar={
          <Sidebar
            chats={displayChats}
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            onChatCreated={handleChatCreated}
          />
        }
        main={<ChatWindow chat={activeChat} />}
      />
    </WebSocketProvider>
  );
}
