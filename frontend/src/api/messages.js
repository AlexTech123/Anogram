import client from "./client";

export const getMessages   = (chatId, beforeId = null, limit = 50) => {
  const p = new URLSearchParams({ limit });
  if (beforeId) p.set("before_id", beforeId);
  return client.get(`/messages/${chatId}?${p}`);
};

export const deleteMessage = (id) => client.delete(`/messages/${id}`);
