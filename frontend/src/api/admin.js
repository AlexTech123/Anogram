import axios from "axios";

const KEY = "admin_token";

const client = axios.create({ baseURL: "/api/admin" });
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminLogin = (password) =>
  client.post("/auth", { password }).then(r => {
    sessionStorage.setItem(KEY, r.data.token);
    return r.data;
  });

export const adminLogout = () => sessionStorage.removeItem(KEY);

export const hasAdminToken = () => !!sessionStorage.getItem(KEY);

export const deleteAdminUser  = (id)  => client.delete(`/users/${id}`);
export const deleteAdminMedia = (url) => client.delete("/storage", { data: { url } });

export const getAdminStats   = () => client.get("/stats").then(r => r.data);
export const getAdminUsers   = () => client.get("/users").then(r => r.data);
export const getAdminChats   = () => client.get("/chats").then(r => r.data);
export const getAdminStorage = () => client.get("/storage").then(r => r.data);
export const getAdminSystem  = () => client.get("/system").then(r => r.data);
