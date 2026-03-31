from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # chat_id → list of (websocket, user_id)
        self.active: dict[int, list[tuple[WebSocket, int]]] = {}

    async def connect(self, websocket: WebSocket, chat_id: int, user_id: int):
        await websocket.accept()
        if chat_id not in self.active:
            self.active[chat_id] = []
        self.active[chat_id].append((websocket, user_id))

    def disconnect(self, websocket: WebSocket, chat_id: int):
        if chat_id in self.active:
            self.active[chat_id] = [
                (ws, uid) for ws, uid in self.active[chat_id] if ws is not websocket
            ]

    async def broadcast(self, chat_id: int, data: dict):
        for ws, _ in list(self.active.get(chat_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()
