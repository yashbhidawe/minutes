
from fastapi import HTTPException
from passlib.context import CryptContext  
import re

email_regex = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
  
def verify_password(plain_password, hashed_password):
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        deprecated="auto"
    )
    return pwd_context.verify(plain_password, hashed_password)

def verify_email_format(email):
    if not email_regex.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    return True

def verify_password_format(plain_password):
    if len(plain_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if len(plain_password.encode()) > 72:
        raise HTTPException(status_code=400, detail="Password must be at most 72 characters long")
    if not any(char.isupper() for char in plain_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not any(char.islower() for char in plain_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")                          
    if not any(char.isdigit() for char in plain_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    if not any(char in "!@#$%^&*()-_=+[]{}|;:,.<>?/" for char in plain_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")
    return True
