import logging
from typing import List, Dict

logger = logging.getLogger("storage_recommender")


def determine_storage_policy(similarity_score: float, duplicate_type: str) -> dict:
    """
    Decides the best storage optimization recommendation based on similarity scores.
    Returns:
      - recommendation_type: 'delete' (for exact match), 'merge' (for semantic),
                             'compress' (for partial), 'archive' (for historical).
      - priority: 'high', 'medium', or 'low'.
    """
    score_pct = similarity_score * 100
    logger.info(f"Analyzing storage optimization policy for duplicate similarity: {score_pct:.1f}%")
    
    if duplicate_type == "exact" or similarity_score >= 0.98:
        return {
            "recommendation_type": "delete",
            "priority": "high",
            "reason": f"Exact binary file duplicate matched (Similarity: {score_pct:.1f}%). Deleting avoids redundant cache space."
        }
    elif duplicate_type == "semantic" or similarity_score >= 0.85:
        return {
            "recommendation_type": "merge",
            "priority": "medium",
            "reason": f"High semantic text overlap identified (Similarity: {score_pct:.1f}%). Merging paragraphs consolidates indexing shards."
        }
    elif duplicate_type == "partial" or similarity_score >= 0.60:
        return {
            "recommendation_type": "compress",
            "priority": "low",
            "reason": f"Partial paragraph overlap matched (Similarity: {score_pct:.1f}%). Compressing storage structures optimizes memory flat files."
        }
    else:
        return {
            "recommendation_type": "archive",
            "priority": "low",
            "reason": "Historical draft overlap detected. Archiving historical revisions logs."
        }
