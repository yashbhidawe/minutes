from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse
from app.core.db_connection import engine
from passlib.context import CryptContext
from app.services.verifyPassword import verify_password_format, verify_email_format
from app.repositories.user import UserRepository

router = APIRouter(prefix="/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate):
    with Session(bind=engine) as session:
        repo = UserRepository(session)
        existing_user = repo.get_by_email(user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        verify_email_format(user.email)
        verify_password_format(user.password)
        password_hash = pwd_context.hash(user.password)
        db_user = repo.create(user, password_hash)
        return db_user