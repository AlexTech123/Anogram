"""Admin panel API — protected by a separate admin JWT (not user auth)."""
from datetime import datetime, timedelta, timezone
from pathlib import Path

import psutil
from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.chat import Chat
from app.models.chat_member import ChatMember
from app.models.message import Message
from app.models.user import User
from app.services.media_service import MEDIA_DIR, QUOTA_BYTES

router = APIRouter(prefix="/admin", tags=["admin"])

_ADMIN_SUB = "anogram_admin"
_ADMIN_ALG = "HS256"
_ADMIN_EXP = 24  # hours


# ── Auth ─────────────────────────────────────────────────────────────────────

def _make_admin_token() -> str:
    payload = {
        "sub": _ADMIN_SUB,
        "admin": True,
        "exp": datetime.now(timezone.utc) + timedelta(hours=_ADMIN_EXP),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=_ADMIN_ALG)


def require_admin(authorization: str = Header(None)) -> None:
    """Dependency: validates admin JWT from Authorization: Bearer <token>."""
    if not settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin panel not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Admin token required")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ADMIN_ALG])
        if payload.get("sub") != _ADMIN_SUB or not payload.get("admin"):
            raise HTTPException(status_code=403, detail="Invalid admin token")
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.post("/auth")
def admin_login(body: dict):
    if not settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin panel not configured")
    if body.get("password") != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Wrong password")
    return {"token": _make_admin_token()}


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(require_admin)])
def admin_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    users_total = db.query(func.count(User.id)).scalar()
    users_active = db.query(func.count(User.id)).filter(User.last_seen >= day_ago).scalar()
    messages_total = db.query(func.count(Message.id)).filter(Message.is_deleted == False).scalar()
    messages_today = db.query(func.count(Message.id)).filter(
        Message.is_deleted == False, Message.created_at >= today_start
    ).scalar()
    chats_total = db.query(func.count(Chat.id)).scalar()

    # Storage
    media_files = 0
    storage_bytes = 0
    if MEDIA_DIR.exists():
        for f in MEDIA_DIR.rglob("*"):
            if f.is_file():
                media_files += 1
                storage_bytes += f.stat().st_size

    return {
        "users_total": users_total,
        "users_active_24h": users_active,
        "messages_total": messages_total,
        "messages_today": messages_today,
        "chats_total": chats_total,
        "media_files": media_files,
        "storage_used_mb": round(storage_bytes / 1024 / 1024, 1),
        "storage_quota_mb": round(QUOTA_BYTES / 1024 / 1024, 1),
        "storage_used_bytes": storage_bytes,
        "storage_quota_bytes": QUOTA_BYTES,
    }


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", dependencies=[Depends(require_admin)])
def admin_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        msg_count = db.query(func.count(Message.id)).filter(
            Message.sender_id == u.id, Message.is_deleted == False
        ).scalar()
        chat_count = db.query(func.count(ChatMember.id)).filter(
            ChatMember.user_id == u.id
        ).scalar()
        result.append({
            "id": u.id,
            "username": u.username,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_seen": u.last_seen.isoformat() if u.last_seen else None,
            "is_active": u.is_active,
            "message_count": msg_count,
            "chat_count": chat_count,
        })
    return result


@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)], status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    from app.services.media_service import _delete_media_file
    from app.models.chat import Chat as ChatModel

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Delete all messages by this user (hard delete — sender_id is SET NULL by FK,
    #    so we must do this explicitly to actually remove them from DB)
    all_msgs = db.query(Message).filter(Message.sender_id == user_id).all()
    for m in all_msgs:
        # Unpin from chat if pinned
        if m.media_url:
            try:
                _delete_media_file(m.media_url)
            except Exception:
                pass
        db.delete(m)
    db.flush()  # apply message deletes before deleting user

    # 2. Delete the user (ChatMember, ContactNickname, PushSubscription cascade via FK)
    db.delete(user)
    db.commit()


# ── Chats ─────────────────────────────────────────────────────────────────────

@router.get("/chats", dependencies=[Depends(require_admin)])
def admin_chats(db: Session = Depends(get_db)):
    chats = db.query(Chat).order_by(Chat.created_at.desc()).all()
    result = []
    for c in chats:
        msg_count = db.query(func.count(Message.id)).filter(
            Message.chat_id == c.id, Message.is_deleted == False
        ).scalar()
        last_msg = db.query(Message).filter(
            Message.chat_id == c.id, Message.is_deleted == False
        ).order_by(Message.created_at.desc()).first()
        members = db.query(ChatMember).filter(ChatMember.chat_id == c.id).all()
        member_names = []
        for m in members:
            u = db.get(User, m.user_id)
            if u:
                member_names.append(u.username)
        result.append({
            "id": c.id,
            "chat_type": c.chat_type,
            "name": c.name,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "message_count": msg_count,
            "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
            "last_message_content": last_msg.content if last_msg else None,
            "members": member_names,
        })
    return result


# ── Storage ───────────────────────────────────────────────────────────────────

@router.get("/storage", dependencies=[Depends(require_admin)])
def admin_storage(db: Session = Depends(get_db)):
    files = []
    total_bytes = 0
    if not MEDIA_DIR.exists():
        return {"files": [], "total_bytes": 0}

    for f in sorted(MEDIA_DIR.rglob("*"), key=lambda x: x.stat().st_mtime if x.is_file() else 0, reverse=True):
        if not f.is_file():
            continue
        size = f.stat().st_size
        total_bytes += size
        # chat_id is the parent directory name
        try:
            chat_id = int(f.parent.name)
        except ValueError:
            chat_id = None
        rel = f.relative_to(MEDIA_DIR)
        files.append({
            "filename": f.name,
            "chat_id": chat_id,
            "size_bytes": size,
            "url": f"/api/media/{rel}",
            "modified_at": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
        })

    return {"files": files, "total_bytes": total_bytes}


@router.delete("/storage", dependencies=[Depends(require_admin)], status_code=200)
def admin_delete_media(body: dict, db: Session = Depends(get_db)):
    """Delete a specific media file by its relative URL (/api/media/chat_id/filename)."""
    from app.services.media_service import _delete_media_file
    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="url required")
    # Remove message record that references this file
    msg = db.query(Message).filter(Message.media_url == url).first()
    if msg:
        db.delete(msg)
        db.commit()
    try:
        _delete_media_file(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"deleted": url}


# ── System ────────────────────────────────────────────────────────────────────

@router.get("/system", dependencies=[Depends(require_admin)])
def admin_system():
    cpu = psutil.cpu_percent(interval=0.2)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "cpu_percent": cpu,
        "ram_used_mb": round(ram.used / 1024 / 1024),
        "ram_total_mb": round(ram.total / 1024 / 1024),
        "ram_percent": ram.percent,
        "disk_used_gb": round(disk.used / 1024 / 1024 / 1024, 2),
        "disk_total_gb": round(disk.total / 1024 / 1024 / 1024, 2),
        "disk_percent": disk.percent,
    }
