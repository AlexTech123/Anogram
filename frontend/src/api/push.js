import client from "./client";

export const getVapidKey   = ()     => client.get("/push/vapid-public-key");
export const pushSubscribe = (body) => client.post("/push/subscribe", body);
export const pushUnsubscribe = (body) => client.post("/push/unsubscribe", body);
