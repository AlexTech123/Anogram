from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.chat_member import ChatMember
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageOut, ReplyInfo


def _build_message_out(db: Session, msg: Message) -> MessageOut:
    sender_username = None
    if msg.sender_id:
        u = db.get(User, msg.sender_id)
        sender_username = u.username if u else None

    reply_to = None
    if msg.reply_to_id:
        parent = db.get(Message, msg.reply_to_id)
        if parent:
            parent_sender = None
            if parent.sender_id:
                u = db.get(User, parent.sender_id)
                parent_sender = u.username if u else None
            reply_to = ReplyInfo(
                id=parent.id,
                content=parent.content if not parent.is_deleted else "",
                sender_username=parent_sender,
            )

    return MessageOut(
        id=msg.id,
        chat_id=msg.chat_id,
        sender_id=msg.sender_id,
        content=msg.content,
        message_type=msg.message_type,
        is_deleted=msg.is_deleted,
        created_at=msg.created_at,
        sender_username=sender_username,
        reply_to=reply_to,
        media_url=msg.media_url,
        file_size=msg.file_size,
    )


def get_messages(db, chat_id, user_id, before_id=None, limit=50):
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    q = db.query(Message).filter(Message.chat_id == chat_id, Message.is_deleted == False)
    if before_id:
        q = q.filter(Message.id < before_id)
    msgs = q.order_by(Message.created_at.desc()).limit(limit).all()
    msgs.reverse()
    return [_build_message_out(db, m) for m in msgs]


def save_message(db: Session, chat_id: int, sender_id: int, content: str, reply_to_id: int | None = None) -> Message:
    msg = Message(
        chat_id=chat_id,
        sender_id=sender_id,
        content=content,
        message_type="text",
        reply_to_id=reply_to_id,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(db: Session, message_id: int, user_id: int) -> None:
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's message")
    # Delete physical media file if present
    if msg.media_url:
        try:
            from app.services.media_service import _delete_media_file
            _delete_media_file(msg.media_url)
        except Exception:
            pass
    db.delete(msg)
    db.commit()
