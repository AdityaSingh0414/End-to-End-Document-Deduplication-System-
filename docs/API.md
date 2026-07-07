# API Documentation

The REST endpoints are exposed via FastAPI.

## Authentication (`api/auth.py`)
- `POST /api/v1/auth/register` - Registers a new user.
- `POST /api/v1/auth/login` - Generates a JWT access token.
- `GET /api/v1/auth/me` - Retrieves the authenticated user profile.

## Document Ingestion (`api/upload.py` and `api/document.py`)
- `POST /api/v1/documents/upload` - Uploads a document (PDF, Docx, Image) to initiate processing.
- `POST /api/v1/documents/upload/bulk` - Processes multiple document uploads.
- `GET /api/v1/documents` - Lists all processed documents.
- `GET /api/v1/documents/{doc_id}` - Gets document metadata and text.
- `DELETE /api/v1/documents/{doc_id}` - Deletes a document record and its binary files.

## Duplicates & Recommendation System (`api/duplicate.py` and `api/recommendation.py`)
- `GET /api/v1/duplicates` - Lists all active duplicate links.
- `POST /api/v1/duplicates/{dup_id}/dismiss` - Dismisses duplicate link warning.
- `GET /api/v1/duplicates/recommendations` - Lists all storage optimization recommendations.
- `POST /api/v1/duplicates/recommendations/{rec_id}/apply` - Executes compaction policies.

## Vector Search & RAG Chat (`api/chatbot.py`)
- `GET /api/v1/search/query` - Executes hybrid vector search and Cross-Encoder re-ranking.
- `POST /api/v1/search/chat` - Queries indexed context using Gemini RAG logic.
