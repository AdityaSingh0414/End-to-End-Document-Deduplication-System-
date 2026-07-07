from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from backend.database.base import Base

class DocumentDuplicate(Base):
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(36), ForeignKey("document.id"), nullable=False)
    duplicate_document_id = Column(String(36), ForeignKey("document.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    duplicate_type = Column(String(50), nullable=False)  # exact, partial, semantic
    explanation = Column(Text, nullable=True)             # XAI explanation string
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
