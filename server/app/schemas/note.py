from pydantic import BaseModel, ConfigDict


class NoteResponse(BaseModel):
    id: int
    meeting_id: int
    section: str
    content: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
