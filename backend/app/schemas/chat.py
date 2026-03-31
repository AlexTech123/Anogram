from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserPublic


class ChatMemberOut(BaseModel):
    user_id: int
    role: str
    user: UserPublic
    model_config = {"from_attributes": True}


class LastMessageOut(BaseModel):
    content: str
    sender_username: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class ChatCreate(BaseModel):
    chat_type: str
    name: str | None = None
    member_ids: list[int]


class ChatOut(BaseModel):
    id: int
    name: str | None
    chat_type: str
    created_by: int | None
    created_at: datetime
    last_message: LastMessageOut | None = None
    partner_username: str | None = None
    unread_count: int = 0
    model_config = {"from_attributes": True}


class ChatDetailOut(ChatOut):
    members: list[ChatMemberOut]
