from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat import Chat
from app.models.chat_member import ChatMember
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatDetailOut, ChatOut
from app.services.chat_service import (
    _build_chat_out, add_member, create_chat,
    get_chat_or_403, get_user_chats, remove_member,
)
from app.core.global_ws_manager import global_manager

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=list[ChatOut])
def list_chats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_chats(db, current_user.id)


@router.post("", response_model=ChatOut)
def create(data: ChatCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat = create_chat(db, data, current_user.id)
    return _build_chat_out(db, chat, current_user.id)


@router.get("/{chat_id}", response_model=ChatDetailOut)
def get_chat(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat = get_chat_or_403(db, chat_id, current_user.id)
    out = _build_chat_out(db, chat, current_user.id)

    # Build ChatDetailOut with members
    detail = ChatDetailOut.model_validate(chat)
    detail.last_message = out.last_message
    detail.partner_username = out.partner_username
    detail.partner_user_id = out.partner_user_id
    detail.unread_count = out.unread_count

    # Find partner's last_read_message_id (what they have read of our messages)
    partner_member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id != current_user.id,
    ).first()
    detail.partner_last_read_id = partner_member.last_read_message_id if partner_member else None

    return detail


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")

    member_ids = [m.user_id for m in db.query(ChatMember).filter(ChatMember.chat_id == chat_id).all()]
    db.delete(chat)
    db.commit()

    for uid in member_ids:
        await global_manager.notify(uid, {"type": "chat_deleted", "chat_id": chat_id})


@router.post("/{chat_id}/members", response_model=ChatDetailOut)
def add_chat_member(chat_id: int, body: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return add_member(db, chat_id, body.get("user_id"), current_user.id)


@router.delete("/{chat_id}/members/{user_id}", status_code=204)
def remove_chat_member(chat_id: int, user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    remove_member(db, chat_id, user_id, current_user.id)
