import json
from pydantic import BaseModel, field_validator


class MeetingCreate(BaseModel):
    title: str
    duration_sec: int


class MeetingResponse(BaseModel):
    id: int
    user_id: int
    title: str
    duration_sec: int
    status: str
    audio_key: str | None = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class MeetingUploadResponse(BaseModel):
    meeting_id: int
    status: str
    audio_key: str


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptResponse(BaseModel):
    id: int
    meeting_id: int
    raw_text: str
    language: str
    segments: list[TranscriptSegment] | None = None
    created_at: str

    class Config:
        from_attributes = True

    @field_validator("segments", mode="before")
    @classmethod
    def parse_segments(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v
