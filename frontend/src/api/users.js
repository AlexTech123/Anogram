import client from "./client";

export const deleteAccount = () => client.delete("/users/me");
export const updateProfile = (data) => client.patch("/users/me", data);
export const uploadAvatar = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return client.post("/users/me/avatar", form, {
    onUploadProgress: onProgress
      ? e => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
};
export const deleteAvatar = () => client.delete("/users/me/avatar");
export const getUser = (id) => client.get(`/users/${id}`);
export const getLastSeen = (id) => client.get(`/users/${id}/last-seen`);
