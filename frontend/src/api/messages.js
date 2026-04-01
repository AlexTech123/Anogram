import client from "./client";

export const getMessages = (chatId, beforeId = null, limit = 50) => {
  const p = new URLSearchParams({ limit });
  if (beforeId) p.set("before_id", beforeId);
  return client.get(`/messages/${chatId}?${p}`);
};
export const searchMessages = (chatId, q) =>
  client.get(`/messages/${chatId}/search?q=${encodeURIComponent(q)}`);
export const deleteMessage = (id) => client.delete(`/messages/${id}`);
export const editMessage = (id, content) => client.patch(`/messages/${id}`, { content });
export const reactToMessage = (id, emoji) => client.post(`/messages/${id}/react`, { emoji });
export const pinMessage = (chatId, msgId) => client.post(`/messages/${chatId}/pin/${msgId}`);
export const unpinMessage = (chatId) => client.delete(`/messages/${chatId}/pin`);

export const uploadMedia = (chatId, file, replyToId = null, onProgress = null) => {
  const form = new FormData();
  form.append("file", file);
  if (replyToId) form.append("reply_to_id", String(replyToId));
  return client.post(`/media/upload/${chatId}`, form, {
    onUploadProgress: onProgress
      ? e => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
};
