from typing import Generator
from sqlalchemy.orm import sessionmaker, Session
from backend.database.connection import engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """Dependency for API endpoints to retrieve a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
