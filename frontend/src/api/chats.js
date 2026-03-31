import client from "./client";

export const getChats   = ()           => client.get("/chats");
export const getChat    = (id)         => client.get(`/chats/${id}`);
export const createChat = (data)       => client.post("/chats", data);
export const deleteChat = (id)         => client.delete(`/chats/${id}`);
export const addMember  = (cid, uid)   => client.post(`/chats/${cid}/members`, { user_id: uid });
export const searchUsers = (q)         => client.get(`/users/search?q=${encodeURIComponent(q)}`);
