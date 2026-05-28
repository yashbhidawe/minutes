from datetime import datetime
from pytz import timezone
from sqlalchemy import Boolean, Column, Integer, String

def ActionItem(Base):
    __tablename__ = 'action_items'

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, foreign_key='meetings.id', nullable=False)  
    description = Column(String, nullable=False)
    assigned_to = Column(String(100), nullable=True)  
    due_date = Column(String(50), nullable=True) 
    isDone = Column(Boolean, nullable=False, default=False) 
    created_at = Column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())