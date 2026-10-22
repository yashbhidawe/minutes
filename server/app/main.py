from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import global_router as global_chat_router
from app.api.chat import router as chat_router
from app.api.meetings import router as meetings_router
from app.api.users import router as users_router
from app.core.db_connection import ensure_schema

app = FastAPI()
ensure_schema()
app.include_router(users_router)
app.include_router(meetings_router)
app.include_router(chat_router)
app.include_router(global_chat_router)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(http://localhost:\d+|http://127\.0\.0\.1:\d+|https://minutes\.itokyash\.online|https://.*\.vercel\.app|https://.*\.nip\.io|chrome-extension://.*)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}




