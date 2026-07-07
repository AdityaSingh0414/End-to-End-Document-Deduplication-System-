from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from backend.database.base import Base

class Recommendation(Base):
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(36), ForeignKey("document.id"), nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # delete, merge, archive, compress
    status = Column(String(50), default="pending")           # pending, applied, ignored
    score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
