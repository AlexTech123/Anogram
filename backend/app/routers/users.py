from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from pathlib import Path
import uuid

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

AVATAR_DIR = Path("/app/media/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


def _last_seen_text(last_seen: datetime | None) -> str | None:
    if not last_seen:
        return None
    now = datetime.now(timezone.utc)
    diff = now - last_seen.replace(tzinfo=timezone.utc) if last_seen.tzinfo is None else now - last_seen
    if diff.total_seconds() < 60:
        return "just now"
    if diff.total_seconds() < 3600:
        m = int(diff.total_seconds() // 60)
        return f"{m} minute{'s' if m > 1 else ''} ago"
    if diff.days == 0:
        h = int(diff.total_seconds() // 3600)
        return f"{h} hour{'s' if h > 1 else ''} ago"
    if diff.days == 1:
        return "yesterday"
    if diff.days < 7:
        return f"{diff.days} days ago"
    return last_seen.strftime("%-d %b %Y")


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.bio is not None:
        current_user.bio = data.bio
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Only image files allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar max size is 5 MB")

    # Delete old avatar file
    if current_user.avatar_url:
        try:
            old = AVATAR_DIR / Path(current_user.avatar_url).name
            old.unlink(missing_ok=True)
        except Exception:
            pass

    safe_name = uuid.uuid4().hex + ext
    (AVATAR_DIR / safe_name).write_bytes(data)
    current_user.avatar_url = f"/api/avatars/{safe_name}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=UserPublic)
def delete_avatar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.avatar_url:
        try:
            old = AVATAR_DIR / Path(current_user.avatar_url).name
            old.unlink(missing_ok=True)
        except Exception:
            pass
        current_user.avatar_url = None
        db.commit()
        db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=204)
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()


@router.get("/online", response_model=list[int])
def get_online_ids(current_user: User = Depends(get_current_user)):
    from app.core.global_ws_manager import global_manager
    return list(global_manager._conns.keys())


@router.get("/search", response_model=list[UserPublic])
def search_users(q: str = Query(..., min_length=1), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(User)
        .filter(User.username.ilike(f"%{q}%"), User.id != current_user.id)
        .limit(20)
        .all()
    )


@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/last-seen")
def get_last_seen(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"last_seen": user.last_seen, "text": _last_seen_text(user.last_seen)}
