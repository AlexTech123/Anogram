from datetime import datetime
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None = None
    bio: str | None = None
    is_active: bool
    created_at: datetime
    last_seen: datetime | None = None
    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
