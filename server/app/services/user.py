from fastapi import HTTPException

from app.schemas.user import LoginRequest, UserCreate
from app.utils.auth import create_access_token
from app.utils.verifyPassword import (
    hash_password,
    verify_email_format,
    verify_password,
    verify_password_format,
)


class UserService:
    def __init__(self, user_repository):
        self.user_repository = user_repository

    def get_user_by_id(self, user_id):
        return self.user_repository.get_by_id(user_id)
    
    def create_user(self, user_data: UserCreate):
        # Login lowercases the email, so store it lowercased too.
        user_data = user_data.model_copy(update={"email": user_data.email.lower()})
        existing_user = self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        verify_email_format(user_data.email)
        verify_password_format(user_data.password)
        password_hash = hash_password(user_data.password)
        return self.user_repository.create(user_data, password_hash)
    
    
    def login_user(self, login_data: LoginRequest):
        email = login_data.email.lower()
        verify_email_format(email)
        user = self.user_repository.get_by_email(email)
        if not user:
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        access_token = create_access_token(data={"sub": user.email})
        
        return {"user": user, "access_token": access_token}