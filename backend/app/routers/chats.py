from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatDetailOut, ChatOut
from app.services.chat_service import (
    add_member,
    create_chat,
    get_chat_or_403,
    get_user_chats,
    remove_member,
)

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=list[ChatOut])
def list_chats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return get_user_chats(db, current_user.id)


@router.post("", response_model=ChatOut)
def create(
    data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_chat(db, data, current_user.id)


@router.get("/{chat_id}", response_model=ChatDetailOut)
def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_chat_or_403(db, chat_id, current_user.id)


@router.post("/{chat_id}/members", response_model=ChatDetailOut)
def add_chat_member(
    chat_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = body.get("user_id")
    return add_member(db, chat_id, user_id, current_user.id)


@router.delete("/{chat_id}/members/{user_id}", status_code=204)
def remove_chat_member(
    chat_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    remove_member(db, chat_id, user_id, current_user.id)
