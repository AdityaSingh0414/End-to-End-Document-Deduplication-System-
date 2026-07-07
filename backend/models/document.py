import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, JSON, Text
from sqlalchemy.orm import relationship
from backend.database.base import Base

class Document(Base):
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_hash = Column(String(64), index=True, nullable=False)  # SHA-256 hash
    status = Column(String(50), default="uploaded")  # uploaded, processing, completed, failed
    metadata_json = Column(JSON, nullable=True)  # Store parsed metadata (author, title, page counts)
    ocr_text = Column(Text, nullable=True)       # Full extracted text from OCR
    language = Column(String(10), nullable=True)  # Detected language code (en, hi, etc.)
    upload_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # User ownership
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    owner = relationship("User", back_populates="documents")
