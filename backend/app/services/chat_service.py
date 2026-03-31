from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.chat_member import ChatMember
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatOut, LastMessageOut


def _attach_last_message(db: Session, chat: Chat) -> ChatOut:
    last = (
        db.query(Message)
        .filter(Message.chat_id == chat.id, Message.is_deleted == False)
        .order_by(Message.created_at.desc())
        .first()
    )
    out = ChatOut.model_validate(chat)
    if last:
        sender_username = None
        if last.sender_id:
            u = db.get(User, last.sender_id)
            sender_username = u.username if u else None
        out.last_message = LastMessageOut(
            content=last.content,
            sender_username=sender_username,
            created_at=last.created_at,
        )
    return out


def get_user_chats(db: Session, user_id: int) -> list[ChatOut]:
    chats = (
        db.query(Chat)
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .filter(ChatMember.user_id == user_id)
        .order_by(Chat.created_at.desc())
        .all()
    )
    return [_attach_last_message(db, c) for c in chats]


def create_chat(db: Session, data: ChatCreate, creator_id: int) -> Chat:
    if data.chat_type == "dm":
        member_ids = list(set(data.member_ids + [creator_id]))
        if len(member_ids) != 2:
            raise HTTPException(status_code=400, detail="DM requires exactly 2 participants")
        existing = _find_existing_dm(db, member_ids[0], member_ids[1])
        if existing:
            return existing
    elif data.chat_type == "group":
        if not data.name:
            raise HTTPException(status_code=400, detail="Group name is required")
        member_ids = list(set(data.member_ids + [creator_id]))
    else:
        raise HTTPException(status_code=400, detail="chat_type must be 'dm' or 'group'")

    chat = Chat(name=data.name, chat_type=data.chat_type, created_by=creator_id)
    db.add(chat)
    db.flush()
    for uid in member_ids:
        db.add(ChatMember(chat_id=chat.id, user_id=uid, role="admin" if uid == creator_id else "member"))
    db.commit()
    db.refresh(chat)
    return chat


def _find_existing_dm(db: Session, user_a: int, user_b: int) -> Chat | None:
    ids_a = {m.chat_id for m in db.query(ChatMember).filter(ChatMember.user_id == user_a)}
    ids_b = {m.chat_id for m in db.query(ChatMember).filter(ChatMember.user_id == user_b)}
    shared = ids_a & ids_b
    if not shared:
        return None
    return db.query(Chat).filter(Chat.id.in_(shared), Chat.chat_type == "dm").first()


def get_chat_or_403(db: Session, chat_id: int, user_id: int) -> Chat:
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")
    return chat


def add_member(db: Session, chat_id: int, user_id: int, requester_id: int) -> Chat:
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    req = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == requester_id
    ).first()
    if not req or req.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add members")
    if db.query(ChatMember).filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id).first():
        raise HTTPException(status_code=400, detail="User already a member")
    db.add(ChatMember(chat_id=chat_id, user_id=user_id, role="member"))
    db.commit()
    db.refresh(chat)
    return chat


def remove_member(db: Session, chat_id: int, user_id: int, requester_id: int) -> None:
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if user_id != requester_id:
        req = db.query(ChatMember).filter(
            ChatMember.chat_id == chat_id, ChatMember.user_id == requester_id
        ).first()
        if not req or req.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can remove members")
    m = db.query(ChatMember).filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(m)
    db.commit()
