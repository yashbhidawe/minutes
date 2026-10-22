# schemas/user.py
from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    id: int
    email: str

    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: str
    password: str
    
class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str

class LoginRequest(BaseModel):
    email: str
    password: str