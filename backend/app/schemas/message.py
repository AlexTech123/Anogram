from datetime import datetime
from pydantic import BaseModel


class ReplyInfo(BaseModel):
    id: int
    content: str
    sender_username: str | None
    model_config = {"from_attributes": True}


class ReactionOut(BaseModel):
    emoji: str
    count: int
    mine: bool


class MessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: int | None
    content: str
    message_type: str
    is_deleted: bool
    created_at: datetime
    edited_at: datetime | None = None
    sender_username: str | None = None
    sender_avatar: str | None = None
    reply_to: ReplyInfo | None = None
    media_url: str | None = None
    file_size: int | None = None
    reactions: list[ReactionOut] = []
    model_config = {"from_attributes": True}
