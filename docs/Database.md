# Database Schema & Vector Indexes

The application combines a relational SQL schema with a high-dimensional vector search database.

## Relational Models (`database/` & `models/`)

1. **User Table**:
   - `id`: Primary key
   - `email`: Unique email identifier
   - `hashed_password`: Secure credentials hash
   - `role`: Access level (admin, user)
2. **Document Table**:
   - `id`: UUID primary key
   - `filename`: Original file name
   - `file_path`: Storage system path
   - `file_hash`: SHA-256 binary hash
   - `status`: Processing state (uploaded, processing, completed, failed)
   - `metadata_json`: Extracted properties (author, layout structures, stamps)
3. **DocumentDuplicate Table**:
   - `document_id`: Source document reference
   - `duplicate_document_id`: Matching target document reference
   - `similarity_score`: Combined Jaccard, semantic and visual score
   - `duplicate_type`: exact, partial, or semantic classification
4. **Recommendation Table**:
   - `document_id`: Target reference
   - `recommendation_type`: Optimization action (delete, merge, compress, archive)
   - `status`: Execution state (pending, applied, ignored)

## Vector Database Index (`ai/vector_database/`)
- **FAISS Index FlatIP**: Store sentence-transformer embeddings (384 dimensions) generated from document OCR slices. Used to execute semantic matches.
- **Qdrant Vector Database**: Client integration for cloud-native vector upsert and queries.
