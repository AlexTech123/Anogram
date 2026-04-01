from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.contact_nickname import ContactNickname
from app.models.user import User

router = APIRouter(prefix="/nicknames", tags=["nicknames"])


class NicknameBody(BaseModel):
    nickname: str


@router.get("")
def list_nicknames(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(ContactNickname).filter(ContactNickname.owner_id == current_user.id).all()
    return {str(r.contact_user_id): r.nickname for r in rows}


@router.put("/{contact_id}", status_code=204)
def set_nickname(
    contact_id: int,
    body: NicknameBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(ContactNickname).filter(
        ContactNickname.owner_id == current_user.id,
        ContactNickname.contact_user_id == contact_id,
    ).first()
    if existing:
        existing.nickname = body.nickname.strip()
    else:
        db.add(ContactNickname(
            owner_id=current_user.id,
            contact_user_id=contact_id,
            nickname=body.nickname.strip(),
        ))
    db.commit()


@router.delete("/{contact_id}", status_code=204)
def delete_nickname(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(ContactNickname).filter(
        ContactNickname.owner_id == current_user.id,
        ContactNickname.contact_user_id == contact_id,
    ).first()
    if row:
        db.delete(row)
        db.commit()
