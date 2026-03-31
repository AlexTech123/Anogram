from datetime import datetime

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: int | None
    content: str
    message_type: str
    is_deleted: bool
    created_at: datetime
    sender_username: str | None = None

    model_config = {"from_attributes": True}


class WSMessagePayload(BaseModel):
    type: str
    content: str | None = None
