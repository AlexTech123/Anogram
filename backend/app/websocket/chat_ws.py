from fastapi import WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.core.websocket_manager import manager
from app.database import SessionLocal
from app.models.chat_member import ChatMember
from app.models.user import User
from app.services.message_service import save_message


async def chat_websocket(websocket: WebSocket, chat_id: int, token: str):
    db: Session = SessionLocal()
    try:
        # Authenticate
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

        # Authorization: must be a member
        membership = (
            db.query(ChatMember)
            .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
            .first()
        )
        if not membership:
            await websocket.close(code=4003)
            return

        await manager.connect(websocket, chat_id, user_id)
        try:
            while True:
                data = await websocket.receive_json()
                if data.get("type") == "message" and data.get("content", "").strip():
                    content = data["content"].strip()
                    msg = save_message(db, chat_id, user_id, content)
                    await manager.broadcast(
                        chat_id,
                        {
                            "type": "message",
                            "message_id": msg.id,
                            "chat_id": chat_id,
                            "sender_id": user_id,
                            "sender_username": user.username,
                            "content": content,
                            "created_at": msg.created_at.isoformat(),
                        },
                    )
        except WebSocketDisconnect:
            manager.disconnect(websocket, chat_id)
    finally:
        db.close()
