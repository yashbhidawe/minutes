from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import LoginResponse, UserCreate, UserResponse
from app.core.db_connection import engine
from app.utils.verifyPassword import verify_password_format, verify_email_format
from app.repositories.user import UserRepository
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])



@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate):
    with Session(bind=engine) as session:
        repo = UserRepository(session)
        service = UserService(repo
                              )
        return service.create_user(user)
    
@router.post("/login", response_model=LoginResponse)
def login_user(email: str, password: str):
    with Session(bind=engine) as session:
        email = email.lower()
        verify_email_format(email)        
        repo = UserRepository(session)
        service = UserService(repo)
        return service.login_user(email, password)