import client from "./client";

export const register = (data) => client.post("/auth/register", data);

export const login = (email, password) =>
  client.post("/auth/login", { email, password });

export const getMe = () => client.get("/users/me");
