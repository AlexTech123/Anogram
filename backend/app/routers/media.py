from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat_member import ChatMember
from app.models.message import Message
from app.models.user import User
from app.services.media_service import MEDIA_DIR, evict_if_needed, save_file, validate_and_infer_type
from app.services.message_service import _build_message_out
from app.core.global_ws_manager import global_manager
from app.core.websocket_manager import manager as chat_ws_manager

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload/{chat_id}")
async def upload_media(
    chat_id: int,
    file: UploadFile = File(...),
    reply_to_id: int | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")

    data = await file.read()
    try:
        msg_type = validate_and_infer_type(file.filename or "file", file.content_type or "application/octet-stream")
        url, size = save_file(chat_id, file.filename or "file", data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if reply_to_id is not None:
        parent = db.get(Message, reply_to_id)
        if not parent or parent.chat_id != chat_id:
            reply_to_id = None

    msg = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content="",
        message_type=msg_type,
        media_url=url,
        file_size=size,
        reply_to_id=reply_to_id,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    evict_if_needed(db)

    msg_out = _build_message_out(db, msg)

    # Broadcast to all in the chat WS (real-time for users with chat open)
    ws_payload = {
        "type": "message",
        "message_id": msg.id,
        "chat_id": chat_id,
        "sender_id": current_user.id,
        "sender_username": current_user.username,
        "content": "",
        "created_at": msg.created_at.isoformat(),
        "message_type": msg_type,
        "media_url": msg.media_url,
        "reply_to": msg_out.reply_to.model_dump() if msg_out.reply_to else None,
    }
    await chat_ws_manager.broadcast(chat_id, ws_payload)

    # Notify via global WS (for sidebar updates)
    members = db.query(ChatMember).filter(ChatMember.chat_id == chat_id).all()
    for m in members:
        await global_manager.notify(m.user_id, {
            "type": "new_message",
            "chat_id": chat_id,
            "message_id": msg.id,
            "sender_username": current_user.username,
            "content": f"[{msg_type}]",
            "created_at": msg.created_at.isoformat(),
        })

    return msg_out


@router.get("/{chat_id}/{filename}")
def serve_media(chat_id: int, filename: str, db: Session = Depends(get_db)):
    """Serve media files — public within the app (auth checked on upload)."""
    path = MEDIA_DIR / str(chat_id) / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)
