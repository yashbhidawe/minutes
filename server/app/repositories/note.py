from sqlalchemy.orm import Session
from app.models.note import Note


class NoteRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_meeting(self, meeting_id: int) -> list[Note]:
        return self.session.query(Note).filter_by(meeting_id=meeting_id).all()

    def create(self, meeting_id: int, section: str, content: str) -> Note:
        note = Note(
            meeting_id=meeting_id,
            section=section,
            content=content,
        )
        self.session.add(note)
        self.session.commit()
        self.session.refresh(note)
        return note

    def create_many(self, meeting_id: int, sections: dict[str, str]) -> list[Note]:
        notes = []
        for section, content in sections.items():
            if content:
                note = Note(meeting_id=meeting_id, section=section, content=content)
                self.session.add(note)
                notes.append(note)
        self.session.commit()
        for note in notes:
            self.session.refresh(note)
        return notes
