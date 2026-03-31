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
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
