import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

INACTIVE_DAYS = 7
CHECK_INTERVAL = 3600  # run every hour


async def cleanup_inactive_users() -> None:
    """Delete users who haven't been seen for INACTIVE_DAYS days."""
    while True:
        await asyncio.sleep(CHECK_INTERVAL)
        try:
            db = SessionLocal()
            cutoff = datetime.now(timezone.utc) - timedelta(days=INACTIVE_DAYS)
            stale = (
                db.query(User)
                .filter(
                    User.last_seen < cutoff,
                    User.last_seen.isnot(None),
                )
                .all()
            )
            # Also delete accounts created > 7 days ago that never logged in after creation
            never_seen = (
                db.query(User)
                .filter(
                    User.last_seen.is_(None),
                    User.created_at < cutoff,
                )
                .all()
            )
            total = stale + never_seen
            for user in total:
                logger.info(f"Deleting inactive user: @{user.username} (last_seen={user.last_seen})")
                db.delete(user)
            if total:
                db.commit()
                logger.info(f"Deleted {len(total)} inactive user(s)")
            db.close()
        except Exception as e:
            logger.error(f"Cleanup task error: {e}")
