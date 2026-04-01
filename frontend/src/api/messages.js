import client from "./client";

export const getMessages = (chatId, beforeId = null, limit = 50) => {
  const p = new URLSearchParams({ limit });
  if (beforeId) p.set("before_id", beforeId);
  return client.get(`/messages/${chatId}?${p}`);
};

export const deleteMessage = (id) => client.delete(`/messages/${id}`);

export const uploadMedia = (chatId, file, replyToId = null) => {
  const form = new FormData();
  form.append("file", file);
  if (replyToId) form.append("reply_to_id", String(replyToId));
  return client.post(`/media/upload/${chatId}`, form);
};
