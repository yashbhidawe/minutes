from pydantic import BaseModel


class NoteResponse(BaseModel):
    id: int
    meeting_id: int
    section: str
    content: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
