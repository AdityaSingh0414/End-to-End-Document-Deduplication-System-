import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from backend.database.session import get_db
from backend import models
from backend.utils.file_utils import storage
from backend.api.auth import get_current_user
from backend.utils.exceptions import UnsupportedFileFormatException, DocumentNotFoundException

router = APIRouter(prefix="/documents", tags=["Document Ingestion"])


# Response schema
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    file_hash: str
    status: str
    language: Optional[str]
    upload_time: datetime

    class Config:
        from_attributes = True


def compute_sha256(content: bytes) -> str:
    """Helper to calculate SHA-256 hash of file content."""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(content)
    return sha256_hash.hexdigest()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify file extensions
    allowed_extensions = {".pdf", ".docx", ".zip", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
    import os
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in allowed_extensions:
        raise UnsupportedFileFormatException(file.filename or "")
    
    # Read file bytes & compute hash
    file_content = await file.read()
    file_size = len(file_content)
    file_hash = compute_sha256(file_content)
    
    # Check for exact duplicate based on hash
    existing_doc = db.query(models.Document).filter(models.Document.file_hash == file_hash).first()
    if existing_doc:
        # File is a duplicate. We will still register it under this user, but flag/mark it,
        # or we can raise a warning. Let's register it and set its duplicate status, or just return the existing one.
        # To show full pipeline flow, let's create a duplicate document entry.
        pass

    # Save to local storage
    saved_path = storage.save_file(file_content, file.filename or "uploaded_file")
    
    # Create Document record
    new_doc = models.Document(
        filename=file.filename or "unnamed",
        file_path=saved_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        file_hash=file_hash,
        status="uploaded",
        user_id=current_user.id
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Auto-link exact duplicate entries in background if another exists
    if existing_doc and existing_doc.id != new_doc.id:
        duplicate_link = models.DocumentDuplicate(
            document_id=new_doc.id,
            duplicate_document_id=existing_doc.id,
            similarity_score=1.0,
            duplicate_type="exact",
            is_dismissed=False
        )
        db.add(duplicate_link)
        
        # Create storage optimization recommendation
        recommendation = models.Recommendation(
            document_id=new_doc.id,
            recommendation_type="delete", # Recommend deleting exact duplicate
            status="pending",
            score=1.0
        )
        db.add(recommendation)
    db.commit()

    # Trigger background parsing, OCR, and vectorization task
    from backend.workers.tasks import process_document_task
    process_document_task.delay(new_doc.id)

    return new_doc


@router.post("/upload/bulk", response_model=List[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def upload_bulk_documents(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = []
    for file in files:
        try:
            doc = await upload_document(file=file, db=db, current_user=current_user)
            results.append(doc)
        except Exception as e:
            # Continue processing other files even if one fails
            # We can log this error
            continue
    return results


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Retrieve documents for current user
    # If admin, retrieve all documents
    if current_user.role == "admin":
        return db.query(models.Document).order_by(models.Document.upload_time.desc()).all()
    return db.query(models.Document).filter(models.Document.user_id == current_user.id).order_by(models.Document.upload_time.desc()).all()


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise DocumentNotFoundException(doc_id)
        
    # Check permissions
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this document."
        )
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise DocumentNotFoundException(doc_id)

    # Check permissions
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this document."
        )
        
    # Delete physical file
    storage.delete_file(doc.file_path)
    
    # Delete database records
    # Remove related duplicate links and recommendations first to avoid constraint errors
    db.query(models.DocumentDuplicate).filter(
        (models.DocumentDuplicate.document_id == doc_id) | 
        (models.DocumentDuplicate.duplicate_document_id == doc_id)
    ).delete()
    db.query(models.Recommendation).filter(models.Recommendation.document_id == doc_id).delete()
    
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted successfully."}


class DocumentUpdate(BaseModel):
    ocr_text: Optional[str] = None
    language: Optional[str] = None


@router.put("/{doc_id}", response_model=DocumentResponse)
def update_document(
    doc_id: str,
    update_data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise DocumentNotFoundException(doc_id)
        
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this document."
        )
        
    if update_data.ocr_text is not None:
        doc.ocr_text = update_data.ocr_text
    if update_data.language is not None:
        doc.language = update_data.language
        
    db.commit()
    db.refresh(doc)
    
    # Re-index in FAISS vector database
    from backend.ai.vector_database.faiss_manager import faiss_index
    faiss_index.add_document(doc.id, doc.ocr_text or "")
    
    return doc
