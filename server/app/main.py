from fastapi import FastAPI
from app.core.db_connection import Base, engine
from app.api.users import router as users_router
from app.models import User


app = FastAPI()
Base.metadata.create_all(bind=engine)
app.include_router(users_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

def create_user(user: User):
    return user
