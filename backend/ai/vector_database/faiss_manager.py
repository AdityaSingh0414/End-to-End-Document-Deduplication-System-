import os
import json
import logging
import numpy as np
import faiss
from backend.config import settings
from backend.ai.embeddings.embedding_model import get_embedding, DIMENSION

logger = logging.getLogger("faiss_index")


class FaissIndexManager:
    def __init__(self, cache_dir: str = settings.CACHE_DIR):
        self.cache_dir = cache_dir
        self.index_file = os.path.join(cache_dir, "faiss_index.bin")
        self.map_file = os.path.join(cache_dir, "faiss_map.json")
        
        # We use IndexFlatIP (Inner Product) which is equivalent to Cosine Similarity for normalized vectors
        self.index = faiss.IndexFlatIP(DIMENSION)
        self.id_map = {}  # Maps index row (str) -> doc_id (str)
        
        self.load_index()

    def load_index(self):
        """Loads FAISS index and ID mapping files from disk if they exist."""
        try:
            if os.path.exists(self.index_file) and os.path.exists(self.map_file):
                self.index = faiss.read_index(self.index_file)
                with open(self.map_file, "r") as f:
                    self.id_map = json.load(f)
                logger.info(f"Loaded FAISS index containing {self.index.ntotal} vectors.")
            else:
                logger.info("Initializing new empty FAISS vector index.")
        except Exception as e:
            logger.error(f"Error loading FAISS index: {e}")
            self.index = faiss.IndexFlatIP(DIMENSION)
            self.id_map = {}

    def save_index(self):
        """Persists the FAISS index and ID mapping to disk."""
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
            faiss.write_index(self.index, self.index_file)
            with open(self.map_file, "w") as f:
                json.dump(self.id_map, f)
            logger.info(f"Saved FAISS index with {self.index.ntotal} vectors.")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def add_document(self, doc_id: str, text: str) -> bool:
        """Embeds and indexes document text inside the vector index."""
        try:
            embedding = get_embedding(text)
            vector = np.array([embedding], dtype=np.float32)
            
            # Add to index
            self.index.add(vector)
            
            # Map index row number -> doc_id
            row_idx = str(self.index.ntotal - 1)
            self.id_map[row_idx] = doc_id
            
            self.save_index()
            return True
        except Exception as e:
            logger.error(f"Failed to add document {doc_id} to vector search: {e}", exc_info=True)
            return False

    def search(self, query: str, top_k: int = 5) -> list:
        """Executes semantic cosine-similarity query against indexed documents."""
        if self.index.ntotal == 0:
            return []
            
        try:
            q_emb = get_embedding(query)
            q_vector = np.array([q_emb], dtype=np.float32)
            
            # Query top_k nearest neighbors
            D, I = self.index.search(q_vector, top_k)
            
            results = []
            for score, idx in zip(D[0], I[0]):
                idx_str = str(idx)
                if idx != -1 and idx_str in self.id_map:
                    results.append({
                        "document_id": self.id_map[idx_str],
                        "score": float(score)
                    })
            return results
        except Exception as e:
            logger.error(f"Search failed for query '{query}': {e}")
            return []


# Single instance
faiss_index = FaissIndexManager()
