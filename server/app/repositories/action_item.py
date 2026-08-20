from sqlalchemy.orm import Session
from app.models.actionItem import ActionItem


class ActionItemRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_meeting(self, meeting_id: int) -> list[ActionItem]:
        return self.session.query(ActionItem).filter_by(meeting_id=meeting_id).all()

    def get_by_id(self, item_id: int) -> ActionItem | None:
        return self.session.query(ActionItem).filter_by(id=item_id).first()

    def update_status(self, item_id: int, status: str) -> ActionItem | None:
        item = self.get_by_id(item_id)
        if not item:
            return None
        item.status = status
        self.session.commit()
        self.session.refresh(item)
        return item

    def create(
        self,
        meeting_id: int,
        description: str,
        assigned_to: str | None = None,
        due_date: str | None = None,
        priority: str = "medium",
    ) -> ActionItem:
        item = ActionItem(
            meeting_id=meeting_id,
            description=description,
            assigned_to=assigned_to,
            due_date=due_date,
            priority=priority,
        )
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def create_many(
        self,
        meeting_id: int,
        items: list[dict],
    ) -> list[ActionItem]:
        action_items = []
        for item in items:
            ai = ActionItem(
                meeting_id=meeting_id,
                description=item["description"],
                assigned_to=item.get("assigned_to"),
                due_date=item.get("due_date"),
                priority=item.get("priority", "medium"),
            )
            self.session.add(ai)
            action_items.append(ai)
        self.session.commit()
        for ai in action_items:
            self.session.refresh(ai)
        return action_items
