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

        # Notify everyone that this user came online
        await global_manager.broadcast_except(user_id, {
            "type": "presence",
            "user_id": user_id,
            "online": True,
        })

        # Send current online list to the newly connected user
        await global_manager.notify(user_id, {
            "type": "online_list",
            "user_ids": list(global_manager._conns.keys()),
        })

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
    finally:
        if user_id is not None:
            global_manager.disconnect(websocket, user_id)
            # Notify everyone this user went offline (if no other connections)
            if user_id not in global_manager._conns:
                await global_manager.broadcast_except(user_id, {
                    "type": "presence",
                    "user_id": user_id,
                    "online": False,
                })
        db.close()
