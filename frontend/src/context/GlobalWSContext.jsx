import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const GlobalWSContext = createContext(null);

export function GlobalWSProvider({ children }) {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";

    let pingInterval = null;

    const connect = () => {
      const ws = new WebSocket(`${proto}://${window.location.host}/ws/global?token=${token}`);
      wsRef.current = ws;

      // Ping every 25s to keep connection alive through proxies
      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 25_000);
      };

      ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data);

          if (msg.type === "online_list") {
            setOnlineIds(new Set(msg.user_ids));
            return;
          }
          if (msg.type === "presence") {
            setOnlineIds(prev => {
              const next = new Set(prev);
              if (msg.online) next.add(msg.user_id);
              else next.delete(msg.user_id);
              return next;
            });
            return;
          }

          setLastEvent(msg);
        } catch {}
      };

      ws.onclose = (e) => {
        clearInterval(pingInterval);
        wsRef.current = null;
        if (e.code !== 1000 && e.code !== 4001) {
          setTimeout(connect, 3000);
        }
      };
    };

    connect();
    return () => {
      clearInterval(pingInterval);
      wsRef.current?.close(1000);
      wsRef.current = null;
    };
  }, [user]);

  return (
    <GlobalWSContext.Provider value={{ lastEvent, onlineIds }}>
      {children}
    </GlobalWSContext.Provider>
  );
}

export const useGlobalWS = () => useContext(GlobalWSContext);
