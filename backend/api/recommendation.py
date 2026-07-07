from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from backend.database.session import get_db
from backend import models
from backend.api.auth import get_current_user
from backend.api.upload import delete_document

router = APIRouter(prefix="/duplicates", tags=["Duplicate & Recommendation System"])


# Schemas
class DuplicateResponse(BaseModel):
    id: int
    document_id: str
    document_name: str
    duplicate_document_id: str
    duplicate_document_name: str
    similarity_score: float
    duplicate_type: str
    is_dismissed: bool
    created_at: datetime


class RecommendationResponse(BaseModel):
    id: int
    document_id: str
    document_name: str
    recommendation_type: str
    status: str
    score: float
    created_at: datetime


@router.get("", response_model=List[DuplicateResponse])
def get_duplicates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Lists all active duplicate relations matching the user's documents."""
    # Find all documents owned by user
    if current_user.role == "admin":
        docs = db.query(models.Document).all()
    else:
        docs = db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
        
    doc_ids = [d.id for d in docs]
    if not doc_ids:
        return []
        
    # Get duplicates relating to these documents
    duplicates = db.query(models.DocumentDuplicate).filter(
        models.DocumentDuplicate.document_id.in_(doc_ids) & 
        (models.DocumentDuplicate.is_dismissed == False)
    ).all()
    
    results = []
    for dup in duplicates:
        doc = db.query(models.Document).filter(models.Document.id == dup.document_id).first()
        dup_doc = db.query(models.Document).filter(models.Document.id == dup.duplicate_document_id).first()
        
        if doc and dup_doc:
            results.append(DuplicateResponse(
                id=dup.id,
                document_id=dup.document_id,
                document_name=doc.filename,
                duplicate_document_id=dup.duplicate_document_id,
                duplicate_document_name=dup_doc.filename,
                similarity_score=dup.similarity_score,
                duplicate_type=dup.duplicate_type,
                is_dismissed=dup.is_dismissed,
                created_at=dup.created_at
            ))
    return results


@router.post("/{dup_id}/dismiss")
def dismiss_duplicate(
    dup_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Dismisses a duplicate warning link."""
    dup = db.query(models.DocumentDuplicate).filter(models.DocumentDuplicate.id == dup_id).first()
    if not dup:
        raise HTTPException(status_code=404, detail="Duplicate link not found.")
        
    # Verify ownership of document
    doc = db.query(models.Document).filter(models.Document.id == dup.document_id).first()
    if not doc or (current_user.role != "admin" and doc.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="No permission to modify this duplicate warning.")
        
    dup.is_dismissed = True
    db.commit()
    return {"detail": "Duplicate warning dismissed."}


@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Lists all pending storage recommendations."""
    if current_user.role == "admin":
        docs = db.query(models.Document).all()
    else:
        docs = db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
        
    doc_ids = [d.id for d in docs]
    if not doc_ids:
        return []
        
    recs = db.query(models.Recommendation).filter(
        models.Recommendation.document_id.in_(doc_ids) & 
        (models.Recommendation.status == "pending")
    ).all()
    
    results = []
    for rec in recs:
        doc = db.query(models.Document).filter(models.Document.id == rec.document_id).first()
        if doc:
            results.append(RecommendationResponse(
                id=rec.id,
                document_id=rec.document_id,
                document_name=doc.filename,
                recommendation_type=rec.recommendation_type,
                status=rec.status,
                score=rec.score,
                created_at=rec.created_at
            ))
    return results


@router.post("/recommendations/{rec_id}/apply")
def apply_recommendation(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Applies a storage optimization recommendation (e.g. deleting duplicate)."""
    rec = db.query(models.Recommendation).filter(models.Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
        
    doc = db.query(models.Document).filter(models.Document.id == rec.document_id).first()
    if not doc or (current_user.role != "admin" and doc.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="No permission to apply this recommendation.")
        
    # Execute actual optimization routine via the StorageSpaceOptimizer policy
    from backend.ai.recommendation.storage_optimizer import StorageSpaceOptimizer
    import logging
    logger = logging.getLogger("duplicate_api")

    optimizer = StorageSpaceOptimizer()
    opt_result = optimizer.run_optimization_routine(document_id=doc.id, action=rec.recommendation_type)
    logger.info(f"Storage optimization completed: {opt_result}")

    reclaimed_bytes = opt_result.get("storage_reclaimed_bytes", 0)

    if rec.recommendation_type == "delete":
        # Delete duplicate file from system
        delete_document(doc_id=doc.id, db=db, current_user=current_user)
        rec.status = "applied"
        db.commit()
        return {
            "detail": "Recommendation applied: duplicate file deleted.",
            "storage_reclaimed_bytes": reclaimed_bytes
        }
    else:
        # Mark other recommendations as applied/completed
        rec.status = "applied"
        db.commit()
        return {
            "detail": f"Recommendation applied: {rec.recommendation_type} action executed.",
            "storage_reclaimed_bytes": reclaimed_bytes
        }
