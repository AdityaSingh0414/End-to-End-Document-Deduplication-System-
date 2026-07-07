from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database.session import get_db
from backend import models
from backend.api.auth import get_current_user
from backend.ai.vector_database.faiss_manager import faiss_index

router = APIRouter(prefix="/search", tags=["Vector Search & RAG"])


# Schemas
class SearchResultResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    upload_time: str
    score: float
    excerpt: str


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    referenced_doc_id: Optional[str]
    referenced_doc_name: Optional[str]


@router.get("/query", response_model=List[SearchResultResponse])
def search_documents(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Executes semantic vector search over ingested documents."""
    # 1. Perform hybrid search combining FAISS & BM25 lexical search
    from backend.ai.vector_database.indexing import perform_hybrid_search
    from backend.ai.vector_database.indexing import SearchReranker

    matches = perform_hybrid_search(q, top_k=limit * 2, alpha=0.7)
    
    # Apply Cross-Encoder Reranking to candidate documents
    reranker = SearchReranker()
    matches = reranker.rerank(q, matches)
    
    # Restrict to user limit
    matches = matches[:limit]
    
    if not matches:
        return []
        
    # 2. Fetch document objects from backend.database
    results = []
    for match in matches:
        doc_id = match["document_id"]
        score = match["score"]
        
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if doc:
            # Check permissions (admins see all, users see their own)
            if current_user.role != "admin" and doc.user_id != current_user.id:
                continue
                
            # Extract query matching excerpt
            ocr_text = doc.ocr_text or ""
            excerpt = ""
            # Simple substring context finder
            idx = ocr_text.lower().find(q.lower())
            if idx != -1:
                start = max(0, idx - 60)
                end = min(len(ocr_text), idx + len(q) + 120)
                excerpt = "..." + ocr_text[start:end].replace("\n", " ") + "..."
            else:
                excerpt = ocr_text[:180].replace("\n", " ") + "..."
                
            results.append(SearchResultResponse(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                upload_time=doc.upload_time.isoformat(),
                score=score,
                excerpt=excerpt
            ))
            
    # Sort results by score descending
    results.sort(key=lambda x: x.score, reverse=True)
    return results


@router.post("/chat", response_model=ChatResponse)
def document_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieval-Augmented Generation (RAG) Document Q&A Endpoint."""
    referenced_doc = None
    context = ""
    
    # 1. Retrieve Context
    if payload.document_id:
        # User specified a document
        doc = db.query(models.Document).filter(models.Document.id == payload.document_id).first()
        if doc:
            if current_user.role != "admin" and doc.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="No permission to query this document.")
            referenced_doc = doc
            context = doc.ocr_text or ""
    else:
        # Perform semantic vector lookup to auto-resolve context
        matches = faiss_index.search(payload.message, top_k=1)
        if matches:
            top_match = matches[0]
            doc = db.query(models.Document).filter(models.Document.id == top_match["document_id"]).first()
            if doc and (current_user.role == "admin" or doc.user_id == current_user.id):
                referenced_doc = doc
                context = doc.ocr_text or ""

    # 2. Generate RAG Answer referencing context and record conversational turn
    from backend.ai.generative_ai.rag_pipeline import generate_rag_response
    from backend.ai.generative_ai.document_chat import DocumentChatSession

    # Record history to session
    session_id = f"user_{current_user.id}_doc_{referenced_doc.id if referenced_doc else 'global'}"
    chat_session = DocumentChatSession(session_id=session_id)
    chat_session.add_message(role="user", content=payload.message)

    if referenced_doc and context.strip():
        answer = generate_rag_response(
            prompt=payload.message, 
            context=context, 
            referenced_filename=referenced_doc.filename
        )
    else:
        answer = generate_rag_response(
            prompt=payload.message,
            context="",
            referenced_filename=None
        )

    chat_session.add_message(role="assistant", content=answer)
        
    return ChatResponse(
        response=answer,
        referenced_doc_id=referenced_doc.id if referenced_doc else None,
        referenced_doc_name=referenced_doc.filename if referenced_doc else None
    )


@router.post("/reindex")
def reindex_all_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Rebuilds the FAISS vector database by parsing all completed documents in SQL."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can rebuild system vector stores."
        )
        
    import faiss
    from backend.ai.vector_database.faiss_manager import DIMENSION
    from backend.ai.vector_database.indexing import bm25_index
    
    # Reset FAISS structures
    faiss_index.index = faiss.IndexFlatIP(DIMENSION)
    faiss_index.id_map = {}
    
    # Reset BM25 structures
    bm25_index.doc_count = 0
    bm25_index.avg_doc_len = 0.0
    bm25_index.doc_lengths = {}
    bm25_index.doc_term_freqs = {}
    bm25_index.doc_ids = []
    bm25_index.term_document_frequency = {}
    
    # Query completed documents
    docs = db.query(models.Document).filter(models.Document.status == "completed").all()
    count = 0
    for doc in docs:
        success_faiss = faiss_index.add_document(doc.id, doc.ocr_text or "")
        success_bm25 = bm25_index.add_document(doc.id, doc.ocr_text or "")
        if success_faiss or success_bm25:
            count += 1
            
    faiss_index.save_index()
    bm25_index.save_index()
    return {"detail": f"Successfully re-indexed {count} documents inside FAISS store."}


@router.get("/stats")
def get_vector_stats(
    current_user: models.User = Depends(get_current_user)
):
    """Retrieves FAISS vector metadata parameters."""
    import os
    from backend.ai.vector_database.faiss_manager import DIMENSION
    return {
        "index_type": "IndexFlatIP (Cosine Similarity)",
        "embedding_model": "all-MiniLM-L6-v2",
        "dimensions": DIMENSION,
        "total_vectors": faiss_index.index.ntotal,
        "index_file_size_bytes": os.path.getsize(faiss_index.index_file) if os.path.exists(faiss_index.index_file) else 0,
        "cache_directory": faiss_index.cache_dir
    }


@router.post("/clear-cache")
def clear_storage_cache(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Deletes all files inside the storage cache directory and resets indices."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can clear the system storage cache."
        )
    
    import shutil
    import os
    import faiss
    from backend.config import settings
    from backend.ai.vector_database.faiss_manager import faiss_index, DIMENSION
    from backend.ai.vector_database.indexing import bm25_index

    # 1. Reset in-memory indices
    try:
        faiss_index.index = faiss.IndexFlatIP(DIMENSION)
        faiss_index.id_map = {}
        
        bm25_index.doc_count = 0
        bm25_index.avg_doc_len = 0.0
        bm25_index.doc_lengths = {}
        bm25_index.doc_term_freqs = {}
        bm25_index.doc_ids = []
        bm25_index.term_document_frequency = {}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset in-memory indices: {str(e)}"
        )

    # 2. Clear disk cache directory
    cache_dir = settings.CACHE_DIR
    errors = []
    if os.path.exists(cache_dir):
        for filename in os.listdir(cache_dir):
            file_path = os.path.join(cache_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                errors.append(f"Failed to delete {filename}: {str(e)}")
                
    if errors:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cache cleared with errors: {', '.join(errors)}"
        )
        
    return {"detail": "Successfully cleared all files from storage cache and reset vector indices."}

