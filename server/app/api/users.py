from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import LoginRequest, LoginResponse, UserCreate, UserResponse
from app.core.db_connection import engine
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
def login_user(login_request: LoginRequest):
    with Session(bind=engine) as session:
        repo = UserRepository(session)
        service = UserService(repo)
        return service.login_user(login_request)