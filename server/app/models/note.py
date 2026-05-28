
import datetime
from pytz import timezone
from sqlalchemy import Column, Integer, String


def Note(Base):
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, foreign_key='meetings.id', nullable=False)  
    content = Column(String, nullable=False)
    created_at = Column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())