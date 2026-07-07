# Document Processing Workflow

This document details the step-by-step pipeline execution for file ingestion, analysis, deduplication, and RAG.

```mermaid
sequenceDiagram
    participant User
    participant Ingestion as Ingestion API (api/upload.py)
    participant Worker as celery Ingestion (workers/tasks.py)
    participant AI as AI Core (ai/)
    participant DB as SQL & Vector Database
    
    User->>Ingestion: Upload File (image/PDF)
    Ingestion->>DB: Create uploaded record
    Ingestion->>Worker: Dispatch Celery Ingestion Task
    Worker->>AI: OpenCV Image Preprocessing & Enhancement
    AI->>AI: Execute PaddleOCR / TrOCR
    AI-->>Worker: Clean Extracted Text
    Worker->>AI: Generate Embeddings (Sentence Transformer)
    AI-->>Worker: Embedding Vector (384-dim)
    Worker->>DB: Add vector to FAISS database index
    Worker->>AI: Jaccard, semantic, visual, signature duplicate checks
    AI-->>Worker: Deduplication score & policy recommendation
    Worker->>DB: Record duplicate links and recommendations
    Worker->>User: Broadcast status "completed" via WebSocket
```

1. **Upload & Preprocess**: Documents are uploaded, enhanced via OpenCV, and deskewed/denoised.
2. **Text Extraction (OCR)**: Scanned text is transcribed using EasyOCR/PaddleOCR or TrOCR models.
3. **Embedding Generation**: The cleaned text is encoded into dense vectors using Sentence Transformers.
4. **Vector Database**: Embeddings are stored in FAISS and BM25 databases.
5. **Deduplication Engine**: Calculates Jaccard overlap, semantic distance, and visual correlations (mean squared error & ResNet features).
6. **RAG & Chat**: Retrieves vector contexts and prompts Gemini LLMs to answer chatbot Q&As.
