from fastapi import WebSocket


class GlobalConnectionManager:
    def __init__(self):
        self._conns: dict[int, list[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: int) -> None:
        await ws.accept()
        self._conns.setdefault(user_id, []).append(ws)

    def disconnect(self, ws: WebSocket, user_id: int) -> None:
        if user_id in self._conns:
            self._conns[user_id] = [w for w in self._conns[user_id] if w is not ws]
            if not self._conns[user_id]:
                del self._conns[user_id]

    async def notify(self, user_id: int, data: dict) -> None:
        for ws in list(self._conns.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def broadcast_except(self, exclude_user_id: int, data: dict) -> None:
        for uid, sockets in list(self._conns.items()):
            if uid == exclude_user_id:
                continue
            for ws in list(sockets):
                try:
                    await ws.send_json(data)
                except Exception:
                    pass


global_manager = GlobalConnectionManager()
