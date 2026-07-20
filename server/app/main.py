from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.db_connection import Base, engine
from app.api.users import router as users_router
from app.models import User


app = FastAPI()
Base.metadata.create_all(bind=engine)
app.include_router(users_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

def create_user(email: str, password_hash: str):
    user = User(email=email, password_hash=password_hash)
    with engine.begin() as connection:
        connection.add(user)
        connection.commit()




