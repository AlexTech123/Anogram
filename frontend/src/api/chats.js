import client from "./client";

export const getChats = () => client.get("/chats");
export const getChat = (id) => client.get(`/chats/${id}`);
export const createChat = (data) => client.post("/chats", data);
export const addMember = (chatId, userId) =>
  client.post(`/chats/${chatId}/members`, { user_id: userId });
export const searchUsers = (q) => client.get(`/users/search?q=${encodeURIComponent(q)}`);
