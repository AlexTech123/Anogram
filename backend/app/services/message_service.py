from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.chat_member import ChatMember
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageOut


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

    result = []
    for msg in msgs:
        sender_username = None
        if msg.sender_id:
            u = db.get(User, msg.sender_id)
            sender_username = u.username if u else None
        result.append(MessageOut(
            id=msg.id, chat_id=msg.chat_id, sender_id=msg.sender_id,
            content=msg.content, message_type=msg.message_type,
            is_deleted=msg.is_deleted, created_at=msg.created_at,
            sender_username=sender_username,
        ))
    return result


def save_message(db, chat_id, sender_id, content):
    msg = Message(chat_id=chat_id, sender_id=sender_id, content=content, message_type="text")
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
    # Hard delete — fully remove from DB
    db.delete(msg)
    db.commit()
