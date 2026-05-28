from fastapi import HTTPException

from app.schemas.user import UserCreate
from app.services.verifyPassword import verify_email_format, verify_password_format, verify_password_format
from app.services.verifyPassword import verify_email_format
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    def __init__(self, user_repository):
        self.user_repository = user_repository

    def get_user_by_id(self, user_id):
        return self.user_repository.get_by_id(user_id)
    
    def create_user(self, user_data: UserCreate):
        existing_user = self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        verify_email_format(user_data.email)
        verify_password_format(user_data.password)
        password_hash = pwd_context.hash(user_data.password)
        return self.user_repository.create(user_data, password_hash)
    
        