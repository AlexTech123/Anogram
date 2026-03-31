import client from "./client";

export const getMessages = (chatId, beforeId = null, limit = 50) => {
  const params = new URLSearchParams({ limit });
  if (beforeId) params.set("before_id", beforeId);
  return client.get(`/messages/${chatId}?${params}`);
};
