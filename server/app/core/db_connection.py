from sqlalchemy import create_engine

from sqlalchemy.orm import DeclarativeBase, Session


engine = create_engine("sqlite:///app.db", echo=True)

class Base(DeclarativeBase):
    pass

