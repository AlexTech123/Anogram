from fastapi import WebSocket


class GlobalConnectionManager:
    """One persistent connection per user — receives events from all their chats."""

    def __init__(self):
        self._conns: dict[int, list[WebSocket]] = {}  # user_id → sockets

    async def connect(self, ws: WebSocket, user_id: int) -> None:
        await ws.accept()
        self._conns.setdefault(user_id, []).append(ws)

    def disconnect(self, ws: WebSocket, user_id: int) -> None:
        if user_id in self._conns:
            self._conns[user_id] = [w for w in self._conns[user_id] if w is not ws]

    async def notify(self, user_id: int, data: dict) -> None:
        for ws in list(self._conns.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                pass


global_manager = GlobalConnectionManager()
