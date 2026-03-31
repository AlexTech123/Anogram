import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const GlobalWSContext = createContext(null);

export function GlobalWSProvider({ children }) {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const connect = () => {
      const ws = new WebSocket(`${proto}://${window.location.host}/ws/global?token=${token}`);
      wsRef.current = ws;
      ws.onmessage = ({ data }) => {
        try { setLastEvent(JSON.parse(data)); } catch {}
      };
      // Reconnect on unexpected close
      ws.onclose = (e) => {
        wsRef.current = null;
        if (e.code !== 1000 && e.code !== 4001) {
          setTimeout(connect, 3000);
        }
      };
    };
    connect();
    return () => { wsRef.current?.close(1000); wsRef.current = null; };
  }, [user]);

  return (
    <GlobalWSContext.Provider value={{ lastEvent }}>
      {children}
    </GlobalWSContext.Provider>
  );
}

export const useGlobalWS = () => useContext(GlobalWSContext);
