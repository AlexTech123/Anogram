from datetime import datetime
from pydantic import BaseModel


class ReplyInfo(BaseModel):
    id: int
    content: str
    sender_username: str | None
    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: int | None
    content: str
    message_type: str
    is_deleted: bool
    created_at: datetime
    sender_username: str | None = None
    reply_to: ReplyInfo | None = None
    model_config = {"from_attributes": True}


class WSMessagePayload(BaseModel):
    type: str
    content: str | None = None
    reply_to_id: int | None = None
