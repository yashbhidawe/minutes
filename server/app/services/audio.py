from fastapi import HTTPException, UploadFile
from app.repositories.meeting import MeetingRepository
from app.services.storage import upload_file

# Use prefix matching — browsers send "audio/webm;codecs=opus" not bare "audio/webm"
ALLOWED_PREFIXES = ("audio/webm", "audio/ogg", "audio/opus", "audio/wav", "audio/mpeg", "audio/mp4")
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


async def upload_audio(meeting_id: int, file: UploadFile, meeting_repo: MeetingRepository):
    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if not content_type.startswith(ALLOWED_PREFIXES):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed audio formats: webm, ogg, opus, wav, mpeg, mp4.",
        )

    file_bytes = await file.read() 

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 100MB.")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "webm"
    audio_key = f"{meeting.user_id}/{meeting_id}/audio.{ext}"

    upload_file(file_bytes, audio_key)

    updated_meeting = meeting_repo.update_status(meeting_id, "uploaded", audio_key)
    if not updated_meeting:
        raise HTTPException(status_code=500, detail="Failed to update meeting status")

    return updated_meeting
