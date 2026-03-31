"""Media file storage with 5 GB total quota.

Files are stored under /app/media/{chat_id}/{filename}.
When total usage exceeds QUOTA_BYTES, oldest files (by message created_at)
are deleted until usage is back under quota.
"""
import logging
import mimetypes
import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.message import Message

logger = logging.getLogger(__name__)

MEDIA_DIR = Path("/app/media")
QUOTA_BYTES = 5 * 1024 ** 3          # 5 GiB
SINGLE_FILE_MAX = 50 * 1024 ** 2     # 50 MiB per file
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_PREFIXES = ("image/", "video/", "audio/")
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".mp4", ".mov", ".webm",
    ".ogg", ".opus", ".mp3", ".m4a", ".webm",
    ".pdf",
}


def validate_and_infer_type(filename: str, content_type: str) -> str:
    """Return message_type: image | video | voice | file. Raises on disallowed."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type not allowed: {ext}")
    if content_type.startswith("image/"):
        return "image"
    if content_type.startswith("video/"):
        return "video"
    if content_type.startswith("audio/"):
        return "voice"
    return "file"


def total_media_bytes() -> int:
    total = 0
    for p in MEDIA_DIR.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except OSError:
                pass
    return total


def save_file(chat_id: int, filename: str, data: bytes) -> tuple[str, int]:
    """Save bytes to disk, return (relative_url, file_size)."""
    if len(data) > SINGLE_FILE_MAX:
        raise ValueError(f"File too large (max {SINGLE_FILE_MAX // 1024 // 1024} MB)")

    ext = Path(filename).suffix.lower()
    safe_name = uuid.uuid4().hex + ext
    dest_dir = MEDIA_DIR / str(chat_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / safe_name
    dest.write_bytes(data)
    return f"/media/{chat_id}/{safe_name}", len(data)


def evict_if_needed(db: Session) -> None:
    """Delete oldest media messages until total usage < quota."""
    while total_media_bytes() >= QUOTA_BYTES:
        # Oldest message with a media file
        msg = (
            db.query(Message)
            .filter(Message.media_url.isnot(None), Message.is_deleted == False)
            .order_by(Message.created_at.asc())
            .first()
        )
        if not msg:
            break
        _delete_media_file(msg.media_url)
        msg.media_url = None
        msg.file_size = None
        msg.message_type = "text"
        if not msg.content:
            msg.content = "[Media removed — storage limit reached]"
        db.commit()
        logger.info(f"Evicted media from message {msg.id} to free space")


def _delete_media_file(url: str) -> None:
    # url like /media/42/abc.jpg → /app/media/42/abc.jpg
    relative = url.lstrip("/media").lstrip("/")
    path = MEDIA_DIR / relative
    try:
        path.unlink(missing_ok=True)
    except Exception as e:
        logger.warning(f"Could not delete {path}: {e}")
