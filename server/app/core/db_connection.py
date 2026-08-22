from sqlalchemy import create_engine

from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


engine = create_engine("sqlite:///app.db", echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

