from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.database import get_db
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = register_user(db, data)
    return Token(access_token=create_access_token({"sub": str(user.id)}))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    return Token(access_token=create_access_token({"sub": str(user.id)}))
