from fastapi import APIRouter, File, HTTPException, Header
from sqlalchemy.orm import Session

from app.core.db_connection import engine


router = APIRouter(prefix="/meetings", tags=["meetings"])



@router.post("/{meeting_id}/upload-audio", headers={"Content-Type": "multipart/form-data"})

async def upload_audio(meeting_id: str, audio: File = File(...), auth : str = Header(...)):
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = auth.split(" ")[1]

    contents = await audio.read()

    with open(f"temp_audio_{meeting_id}_{audio.filename}", "wb") as f:
        f.write(contents)

    return {
        "meeting_id": meeting_id,
        "filename": audio.filename,
        "status": "completed"
    }

   
