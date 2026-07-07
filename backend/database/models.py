import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, JSON, Text
from sqlalchemy.orm import relationship
from backend.database.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")  # admin, manager, user
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    documents = relationship("Document", back_populates="owner")


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

    # Relationships for duplicates
    # We resolve the duplicates list self-referentially or via a separate table
    # duplicates is handled via DocumentDuplicate table


class DocumentDuplicate(Base):
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(36), ForeignKey("document.id"), nullable=False)
    duplicate_document_id = Column(String(36), ForeignKey("document.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    duplicate_type = Column(String(50), nullable=False)  # exact, partial, semantic
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Recommendation(Base):
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(36), ForeignKey("document.id"), nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # delete, merge, archive, compress
    status = Column(String(50), default="pending")           # pending, applied, ignored
    score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
