from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from backend.database.session import get_db
from backend import models
from backend.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["System Analytics"])


@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Calculates live dashboard metrics from backend.database tables."""
    # Filter documents by ownership (admins see all, users see their own)
    doc_query = db.query(models.Document)
    if current_user.role != "admin":
        doc_query = doc_query.filter(models.Document.user_id == current_user.id)
        
    total_docs = doc_query.count()
    
    # Format list of doc IDs
    docs = doc_query.all()
    doc_ids = [d.id for d in docs]
    
    # Active duplicates count
    duplicate_count = 0
    storage_saved = 0
    if doc_ids:
        duplicate_count = db.query(models.DocumentDuplicate).filter(
            models.DocumentDuplicate.document_id.in_(doc_ids) & 
            (models.DocumentDuplicate.is_dismissed == False)
        ).count()
        
        # Calculate storage saved from applied recommendations (deleted duplicates)
        # Sum of files sizes of duplicate records
        # For simulation, we look at exact duplicate files size
        exact_dups = db.query(models.DocumentDuplicate).filter(
            models.DocumentDuplicate.document_id.in_(doc_ids) &
            (models.DocumentDuplicate.duplicate_type == "exact")
        ).all()
        
        storage_saved = sum(
            db.query(models.Document).filter(models.Document.id == ed.document_id).first().file_size 
            for ed in exact_dups if db.query(models.Document).filter(models.Document.id == ed.document_id).first()
        )

    # Status distribution
    status_counts = {"uploaded": 0, "processing": 0, "completed": 0, "failed": 0}
    for doc in docs:
        status_counts[doc.status] = status_counts.get(doc.status, 0) + 1
        
    # Language distribution
    language_counts = {}
    for doc in docs:
        lang = doc.language or "unknown"
        language_counts[lang] = language_counts.get(lang, 0) + 1
        
    # Format distribution
    format_counts = {"pdf": 0, "docx": 0, "images": 0, "archives": 0}
    for doc in docs:
        mime = doc.mime_type.lower()
        if "pdf" in mime:
            format_counts["pdf"] += 1
        elif "word" in mime or "officedocument" in mime:
            format_counts["docx"] += 1
        elif "image" in mime:
            format_counts["images"] += 1
        elif "zip" in mime:
            format_counts["archives"] += 1

    duplicate_ratio = 0.0
    if total_docs > 0:
        duplicate_ratio = (duplicate_count / total_docs) * 100

    return {
        "total_documents": total_docs,
        "duplicate_count": duplicate_count,
        "duplicate_ratio": round(duplicate_ratio, 2),
        "storage_saved_bytes": storage_saved,
        "status_distribution": status_counts,
        "language_distribution": language_counts,
        "format_distribution": format_counts
    }
