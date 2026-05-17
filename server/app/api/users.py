from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.core.db_connection import engine
from app.schemas.user import UserResponse
from passlib.context import CryptContext
router = APIRouter(prefix="/users", tags=["users"])



pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate):
    with Session(bind=engine) as session:
        existing_user = session.query(User).filter_by(email=user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = pwd_context.hash(user.password)
        password_hash=hashed_password
        
        db_user = User(
    email=user.email,
    password_hash=password_hash
)
        
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user