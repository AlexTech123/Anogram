import { useEffect, useRef, useState } from "react";
import { getMessages } from "../api/messages";
import { useWebSocket } from "../context/WebSocketContext";

export function useMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUnseenCount, setNewUnseenCount] = useState(0);
  const { lastMessage } = useWebSocket();
  const prevChatId = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    prevChatId.current = chatId;
    setLoading(true);
    setMessages([]);
    setNewUnseenCount(0);
    getMessages(chatId)
      .then(r => { if (prevChatId.current === chatId) setMessages(r.data); })
      .finally(() => setLoading(false));
  }, [chatId]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "message" && lastMessage.chat_id === chatId) {
      setMessages(prev => {
        if (prev.some(m => m.id === lastMessage.message_id)) return prev;
        return [...prev, {
          id: lastMessage.message_id,
          chat_id: lastMessage.chat_id,
          sender_id: lastMessage.sender_id,
          sender_username: lastMessage.sender_username,
          sender_avatar: lastMessage.sender_avatar || null,
          content: lastMessage.content || "",
          created_at: lastMessage.created_at,
          message_type: lastMessage.message_type || "text",
          is_deleted: false,
          reply_to: lastMessage.reply_to || null,
          media_url: lastMessage.media_url || null,
          reactions: [],
        }];
      });
    }

    if (lastMessage.type === "message_edited" && lastMessage.chat_id === chatId) {
      setMessages(prev => prev.map(m =>
        m.id === lastMessage.message_id
          ? { ...m, content: lastMessage.content, edited_at: lastMessage.edited_at }
          : m
      ));
    }

    if (lastMessage.type === "reaction_updated" && lastMessage.chat_id === chatId) {
      setMessages(prev => prev.map(m =>
        m.id === lastMessage.message_id
          ? { ...m, reactions: lastMessage.reactions }
          : m
      ));
    }
  }, [lastMessage, chatId]);

  const markSeen = () => setNewUnseenCount(0);

  return { messages, loading, newUnseenCount, setNewUnseenCount, markSeen };
}
