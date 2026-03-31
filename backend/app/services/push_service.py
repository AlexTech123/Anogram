import json
import logging
from sqlalchemy.orm import Session
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)


def send_push_to_user(db: Session, user_id: int, title: str, body: str, data: dict | None = None) -> None:
    """Send Web Push notification to all subscriptions of a user."""
    try:
        from py_vapid import Vapid
        from pywebpush import webpush, WebPushException
        from app.config import settings
    except Exception as e:
        logger.warning(f"Push not configured: {e}")
        return

    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return

    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    dead = []

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps({"title": title, "body": body, **(data or {})}),
                vapid_private_key=settings.VAPID_PRIVATE_KEY.replace("\\n", "\n"),
                vapid_claims={"sub": "mailto:anogram@localhost"},
            )
        except Exception as e:
            logger.warning(f"Push failed for subscription {sub.id}: {e}")
            # Mark dead subscriptions for cleanup
            if "410" in str(e) or "404" in str(e):
                dead.append(sub)

    for sub in dead:
        db.delete(sub)
    if dead:
        db.commit()


def save_subscription(db: Session, user_id: int, endpoint: str, p256dh: str, auth: str) -> None:
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    if existing:
        existing.user_id = user_id
        existing.p256dh = p256dh
        existing.auth = auth
    else:
        db.add(PushSubscription(user_id=user_id, endpoint=endpoint, p256dh=p256dh, auth=auth))
    db.commit()


def remove_subscription(db: Session, endpoint: str) -> None:
    sub = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    if sub:
        db.delete(sub)
        db.commit()
