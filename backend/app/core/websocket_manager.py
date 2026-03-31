from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # chat_id → list of (websocket, user_id)
        self.active: dict[int, list[tuple[WebSocket, int]]] = {}
        # user_id → number of open connections (across all chats)
        self._conn_count: dict[int, int] = {}

    @property
    def online_users(self) -> set[int]:
        return set(self._conn_count.keys())

    async def connect(self, websocket: WebSocket, chat_id: int, user_id: int) -> bool:
        """Accept connection. Returns True if the user just came online."""
        await websocket.accept()
        self.active.setdefault(chat_id, []).append((websocket, user_id))
        was_offline = self._conn_count.get(user_id, 0) == 0
        self._conn_count[user_id] = self._conn_count.get(user_id, 0) + 1
        return was_offline

    def disconnect(self, websocket: WebSocket, chat_id: int, user_id: int) -> bool:
        """Remove connection. Returns True if the user just went offline."""
        if chat_id in self.active:
            self.active[chat_id] = [
                (ws, uid) for ws, uid in self.active[chat_id] if ws is not websocket
            ]
        count = self._conn_count.get(user_id, 1)
        if count <= 1:
            self._conn_count.pop(user_id, None)
            return True
        self._conn_count[user_id] = count - 1
        return False

    def is_online(self, user_id: int) -> bool:
        return user_id in self._conn_count

    def online_in_chat(self, chat_id: int) -> list[int]:
        return list({uid for _, uid in self.active.get(chat_id, [])})

    async def broadcast(
        self,
        chat_id: int,
        data: dict,
        exclude_ws: WebSocket | None = None,
    ) -> None:
        for ws, _ in list(self.active.get(chat_id, [])):
            if ws is exclude_ws:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def send_to(self, websocket: WebSocket, data: dict) -> None:
        try:
            await websocket.send_json(data)
        except Exception:
            pass


manager = ConnectionManager()
