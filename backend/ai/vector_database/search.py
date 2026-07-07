import logging
from backend.ai.vector_database.faiss_manager import faiss_index

logger = logging.getLogger("vector_retrieval")

class LCDocument:
    def __init__(self, page_content: str, metadata: dict = None):
        self.page_content = page_content
        self.metadata = metadata or {}

class VectorStoreSearcher:
    def __init__(self):
        logger.info("Initialized Vector Store Searcher.")

    def search_embeddings(self, query: str, top_k: int = 5) -> list:
        """
        Queries the FAISS database to find the nearest semantic matches.
        """
        logger.info(f"Scanning embeddings for query: '{query}'")
        return faiss_index.search(query, top_k=top_k)

class LangChainRetriever:
    def __init__(self):
        self.searcher = VectorStoreSearcher()
        logger.info("Initialized LangChain-style Retriever.")

    def get_relevant_documents(self, query: str, top_k: int = 5) -> list:
        """
        Retrieves matching document fragments wrapped as LangChain Document objects.
        """
        logger.info(f"LangChain retrieving relevant documents for query: '{query}'")
        raw_matches = self.searcher.search_embeddings(query, top_k=top_k)
        docs = []
        for match in raw_matches:
            docs.append(LCDocument(
                page_content=match.get("text", ""),
                metadata={
                    "document_id": match.get("document_id"),
                    "score": match.get("score"),
                    "filename": match.get("filename", "")
                }
            ))
        return docs
