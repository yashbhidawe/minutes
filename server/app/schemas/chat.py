from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=12)


class Citation(BaseModel):
    chunk_index: int
    start_sec: float | None = None
    end_sec: float | None = None
    text: str
    score: float


class AskResponse(BaseModel):
    meeting_id: int
    question: str
    answer: str
    citations: list[Citation]
    retrieved_chunks: list[Citation]


class IndexResponse(BaseModel):
    meeting_id: int
    chunks_indexed: int
    status: str = "indexed"


class GlobalAskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=8, ge=1, le=12)


class GlobalCitation(BaseModel):
    meeting_id: int
    meeting_title: str
    chunk_index: int
    start_sec: float | None = None
    end_sec: float | None = None
    text: str
    score: float


class GlobalAskResponse(BaseModel):
    question: str
    answer: str
    citations: list[GlobalCitation]
    retrieved_chunks: list[GlobalCitation]
