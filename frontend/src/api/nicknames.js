import client from "./client";

export const getNicknames = () => client.get("/nicknames");
export const setNickname = (contactId, nickname) =>
  client.put(`/nicknames/${contactId}`, { nickname });
export const deleteNickname = (contactId) =>
  client.delete(`/nicknames/${contactId}`);
