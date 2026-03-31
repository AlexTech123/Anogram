from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.push_service import remove_subscription, save_subscription

router = APIRouter(prefix="/push", tags=["push"])


class SubscribeBody(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.get("/vapid-public-key")
def get_vapid_key():
    return {"key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe", status_code=204)
def subscribe(body: SubscribeBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    save_subscription(db, current_user.id, body.endpoint, body.p256dh, body.auth)


@router.post("/unsubscribe", status_code=204)
def unsubscribe(body: SubscribeBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    remove_subscription(db, body.endpoint)
