from pydantic import BaseModel, ConfigDict


class ActionItemResponse(BaseModel):
    id: int
    meeting_id: int
    description: str
    assigned_to: str | None = None
    due_date: str | None = None
    priority: str
    status: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class ActionItemListResponse(BaseModel):
    action_items: list[ActionItemResponse]
