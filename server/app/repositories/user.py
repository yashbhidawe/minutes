from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        return self.session.query(User).filter(func.lower(User.email) == email.lower()).first()

    def create(self, user_data: UserCreate, password_hash: str) -> User:
        db_user = User(
            email=user_data.email,
            password_hash=password_hash,
        )
        self.session.add(db_user)
        self.session.commit()
       


        self.session.refresh(db_user)
        return db_user
