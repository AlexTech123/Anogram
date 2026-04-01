from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter(prefix="/avatars", tags=["avatars"])
AVATAR_DIR = Path("/app/media/avatars")


@router.get("/{filename}")
def serve_avatar(filename: str):
    path = AVATAR_DIR / filename
    if not path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
    return FileResponse(path)
