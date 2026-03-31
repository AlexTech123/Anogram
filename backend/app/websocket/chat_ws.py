from fastapi import WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.core.websocket_manager import manager
from app.database import SessionLocal
from app.models.chat_member import ChatMember
from app.models.user import User
from app.services.message_service import save_message


async def chat_websocket(websocket: WebSocket, chat_id: int, token: str) -> None:
    db: Session = SessionLocal()
    user_id: int | None = None

    try:
        # ── Authenticate ──────────────────────────────────────────────────────
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

        membership = (
            db.query(ChatMember)
            .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
            .first()
        )
        if not membership:
            await websocket.close(code=4003)
            return

        # ── Connect ───────────────────────────────────────────────────────────
        just_came_online = await manager.connect(websocket, chat_id, user_id)

        # Tell the joining client who is currently online in this chat
        await manager.send_to(websocket, {
            "type": "online_status",
            "online_user_ids": manager.online_in_chat(chat_id),
        })

        # Tell everyone else in the chat that this user is online
        if just_came_online:
            await manager.broadcast(chat_id, {
                "type": "user_online",
                "user_id": user_id,
            }, exclude_ws=websocket)

        # ── Receive loop ──────────────────────────────────────────────────────
        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")

                if msg_type == "message":
                    content = (data.get("content") or "").strip()
                    if not content:
                        continue
                    msg = save_message(db, chat_id, user_id, content)
                    await manager.broadcast(chat_id, {
                        "type": "message",
                        "message_id": msg.id,
                        "chat_id": chat_id,
                        "sender_id": user_id,
                        "sender_username": user.username,
                        "content": content,
                        "created_at": msg.created_at.isoformat(),
                    })

                elif msg_type == "typing":
                    await manager.broadcast(chat_id, {
                        "type": "typing",
                        "user_id": user_id,
                        "username": user.username,
                    }, exclude_ws=websocket)

                elif msg_type == "read":
                    message_id = data.get("message_id")
                    if not isinstance(message_id, int):
                        continue
                    # Persist only if advancing
                    if (
                        membership.last_read_message_id is None
                        or message_id > membership.last_read_message_id
                    ):
                        membership.last_read_message_id = message_id
                        db.commit()
                    # Broadcast receipt to other members
                    await manager.broadcast(chat_id, {
                        "type": "read_receipt",
                        "user_id": user_id,
                        "message_id": message_id,
                    }, exclude_ws=websocket)

        except WebSocketDisconnect:
            pass

    finally:
        if user_id is not None:
            went_offline = manager.disconnect(websocket, chat_id, user_id)
            if went_offline:
                await manager.broadcast(chat_id, {
                    "type": "user_offline",
                    "user_id": user_id,
                })
        db.close()
