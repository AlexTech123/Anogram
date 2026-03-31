from fastapi import WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import decode_access_token
from app.core.global_ws_manager import global_manager
from app.database import SessionLocal
from app.models.user import User


async def global_websocket(websocket: WebSocket, token: str) -> None:
    db = SessionLocal()
    user_id: int | None = None
    try:
        try:
            payload = decode_access_token(token)
            user_id = int(payload.get("sub"))
        except (JWTError, TypeError, ValueError):
            await websocket.close(code=4001)
            return

        user = db.get(User, user_id)
        if not user or not user.is_active:
            await websocket.close(code=4001)
            return

        await global_manager.connect(websocket, user_id)
        try:
            while True:
                # Keep connection alive; client sends nothing
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
    finally:
        if user_id is not None:
            global_manager.disconnect(websocket, user_id)
        db.close()
