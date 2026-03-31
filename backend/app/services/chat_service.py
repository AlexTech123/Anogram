from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.chat_member import ChatMember
from app.schemas.chat import ChatCreate


def get_user_chats(db: Session, user_id: int) -> list[Chat]:
    return (
        db.query(Chat)
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .filter(ChatMember.user_id == user_id)
        .order_by(Chat.created_at.desc())
        .all()
    )


def create_chat(db: Session, data: ChatCreate, creator_id: int) -> Chat:
    if data.chat_type == "dm":
        member_ids = list(set(data.member_ids + [creator_id]))
        if len(member_ids) != 2:
            raise HTTPException(status_code=400, detail="DM requires exactly 2 participants")
        # Check for existing DM between these two users
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
        role = "admin" if uid == creator_id else "member"
        db.add(ChatMember(chat_id=chat.id, user_id=uid, role=role))

    db.commit()
    db.refresh(chat)
    return chat


def _find_existing_dm(db: Session, user_a: int, user_b: int) -> Chat | None:
    dm_ids_a = {m.chat_id for m in db.query(ChatMember).filter(ChatMember.user_id == user_a).all()}
    dm_ids_b = {m.chat_id for m in db.query(ChatMember).filter(ChatMember.user_id == user_b).all()}
    shared = dm_ids_a & dm_ids_b
    if not shared:
        return None
    return (
        db.query(Chat)
        .filter(Chat.id.in_(shared), Chat.chat_type == "dm")
        .first()
    )


def get_chat_or_403(db: Session, chat_id: int, user_id: int) -> Chat:
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    member = (
        db.query(ChatMember)
        .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")
    return chat


def add_member(db: Session, chat_id: int, user_id: int, requester_id: int) -> Chat:
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    requester_membership = (
        db.query(ChatMember)
        .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == requester_id)
        .first()
    )
    if not requester_membership or requester_membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add members")
    existing = (
        db.query(ChatMember)
        .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
        .first()
    )
    if existing:
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
        requester_membership = (
            db.query(ChatMember)
            .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == requester_id)
            .first()
        )
        if not requester_membership or requester_membership.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can remove other members")
    membership = (
        db.query(ChatMember)
        .filter(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(membership)
    db.commit()
