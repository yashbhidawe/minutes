# schemas/user.py
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str
    