import client from "./client";

export const register = (data) => client.post("/auth/register", data);
export const login    = (username, password) => client.post("/auth/login", { username, password });
export const getMe    = () => client.get("/users/me");
