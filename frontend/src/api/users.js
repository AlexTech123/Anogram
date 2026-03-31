import client from "./client";

export const deleteAccount = () => client.delete("/users/me");
