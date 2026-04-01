from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat_member import ChatMember
from app.models.chat import Chat
from app.models.user import User
from app.schemas.message import MessageOut
from app.services.message_service import (
    delete_message, edit_message, get_messages,
    search_messages, toggle_reaction, _build_message_out,
)

router = APIRouter(prefix="/messages", tags=["messages"])


class EditBody(BaseModel):
    content: str


class ReactionBody(BaseModel):
    emoji: str


@router.get("/{chat_id}", response_model=list[MessageOut])
def list_messages(
    chat_id: int,
    before_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_messages(db, chat_id, current_user.id, before_id, limit)


@router.get("/{chat_id}/search", response_model=list[MessageOut])
def search(
    chat_id: int,
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return search_messages(db, chat_id, current_user.id, q)


@router.patch("/{message_id}", response_model=MessageOut)
async def update_message(
    message_id: int,
    body: EditBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.core.websocket_manager import manager
    msg = edit_message(db, message_id, current_user.id, body.content)
    out = _build_message_out(db, msg, current_user.id)
    await manager.broadcast(msg.chat_id, {
        "type": "message_edited",
        "message_id": msg.id,
        "chat_id": msg.chat_id,
        "content": msg.content,
        "edited_at": msg.edited_at.isoformat(),
    })
    return out


@router.post("/{message_id}/react", response_model=MessageOut)
async def react(
    message_id: int,
    body: ReactionBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.core.websocket_manager import manager
    msg = toggle_reaction(db, message_id, current_user.id, body.emoji)
    out = _build_message_out(db, msg, current_user.id)
    await manager.broadcast(msg.chat_id, {
        "type": "reaction_updated",
        "message_id": msg.id,
        "chat_id": msg.chat_id,
        "reactions": [r.model_dump() for r in out.reactions],
    })
    return out


@router.delete("/{message_id}", status_code=204)
def remove_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_message(db, message_id, current_user.id)


@router.post("/{chat_id}/pin/{message_id}", response_model=MessageOut)
def pin_message(
    chat_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    chat = db.get(Chat, chat_id)
    chat.pinned_message_id = message_id
    db.commit()
    from app.models.message import Message
    msg = db.get(Message, message_id)
    return _build_message_out(db, msg, current_user.id)


@router.delete("/{chat_id}/pin", status_code=204)
def unpin_message(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id, ChatMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    chat = db.get(Chat, chat_id)
    chat.pinned_message_id = None
    db.commit()
