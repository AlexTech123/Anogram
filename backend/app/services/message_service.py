from datetime import datetime, timezone
from collections import defaultdict
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.chat_member import ChatMember
from app.models.message import Message
from app.models.reaction import Reaction
from app.models.user import User
from app.schemas.message import MessageOut, ReactionOut, ReplyInfo


def _build_reactions(msg: Message, current_user_id: int) -> list[ReactionOut]:
    counts: dict[str, int] = defaultdict(int)
    mine: set[str] = set()
    for r in (msg.reactions or []):
        counts[r.emoji] += 1
        if r.user_id == current_user_id:
            mine.add(r.emoji)
    return [ReactionOut(emoji=e, count=c, mine=e in mine) for e, c in counts.items()]


def _build_message_out(db: Session, msg: Message, current_user_id: int = 0) -> MessageOut:
    sender_username = None
    sender_avatar = None
    if msg.sender_id:
        u = db.get(User, msg.sender_id)
        if u:
            sender_username = u.username
            sender_avatar = u.avatar_url

    reply_to = None
    if msg.reply_to_id:
        parent = db.get(Message, msg.reply_to_id)
        if parent:
            pu = db.get(User, parent.sender_id) if parent.sender_id else None
            reply_to = ReplyInfo(
                id=parent.id,
                content=parent.content if not parent.is_deleted else "",
                sender_username=pu.username if pu else None,
            )

    return MessageOut(
        id=msg.id,
        chat_id=msg.chat_id,
        sender_id=msg.sender_id,
        content=msg.content,
        message_type=msg.message_type,
        is_deleted=msg.is_deleted,
        created_at=msg.created_at,
        edited_at=msg.edited_at,
        sender_username=sender_username,
        sender_avatar=sender_avatar,
        reply_to=reply_to,
        media_url=msg.media_url,
        file_size=msg.file_size,
        reactions=_build_reactions(msg, current_user_id),
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
    return [_build_message_out(db, m, user_id) for m in msgs]


def search_messages(db, chat_id, user_id, query: str, limit=30):
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    msgs = (
        db.query(Message)
        .filter(
            Message.chat_id == chat_id,
            Message.is_deleted == False,
            Message.content.ilike(f"%{query}%"),
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_build_message_out(db, m, user_id) for m in msgs]


def save_message(db: Session, chat_id: int, sender_id: int, content: str, reply_to_id: int | None = None) -> Message:
    msg = Message(chat_id=chat_id, sender_id=sender_id, content=content,
                  message_type="text", reply_to_id=reply_to_id)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def edit_message(db: Session, message_id: int, user_id: int, content: str) -> Message:
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's message")
    if msg.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot edit deleted message")
    msg.content = content.strip()
    msg.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(db: Session, message_id: int, user_id: int) -> None:
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's message")
    if msg.media_url:
        try:
            from app.services.media_service import _delete_media_file
            _delete_media_file(msg.media_url)
        except Exception:
            pass
    db.delete(msg)
    db.commit()


def toggle_reaction(db: Session, message_id: int, user_id: int, emoji: str) -> Message:
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    existing = db.query(Reaction).filter(
        Reaction.message_id == message_id,
        Reaction.user_id == user_id,
        Reaction.emoji == emoji,
    ).first()
    if existing:
        db.delete(existing)
    else:
        db.add(Reaction(message_id=message_id, user_id=user_id, emoji=emoji))
    db.commit()
    db.refresh(msg)
    return msg
