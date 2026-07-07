import logging
from backend.ai.recommendation.duplicate_recommender import determine_storage_policy

logger = logging.getLogger("duplicate_recommendation")


class DuplicateRecommender:
    def __init__(self, high_similarity_threshold: float = 0.85):
        self.threshold = high_similarity_threshold
        logger.info(f"Initialized Duplicate Recommender (Threshold: {high_similarity_threshold}).")

    def recommend(self, similarity_score: float, duplicate_type: str) -> dict:
        """
        Decides the storage action (delete, merge, compress, or archive) based on overlap scores.
        """
        logger.info(f"Generating policy for duplicate relation (Score: {similarity_score:.4f}, Type: {duplicate_type})")
        return determine_storage_policy(similarity_score, duplicate_type)
