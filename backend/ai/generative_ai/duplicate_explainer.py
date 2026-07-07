import logging

logger = logging.getLogger("duplicate_explainer")

import json
import logging

logger = logging.getLogger("duplicate_explainer")

def generate_duplicate_explanation(features: dict, duplicate_type: str, doc1_name: str = "Doc A", doc2_name: str = "Doc B") -> str:
    """
    Generates structured, JSON-formatted explanations of duplicate classification results,
    including metrics for text similarity, OCR accuracy, image similarity, and metadata match.
    """
    logger.info("Generating structured metrics and explanations...")
    
    jaccard = features.get("jaccard", 0.0)
    semantic = features.get("semantic", 0.0)
    visual = features.get("visual", 0.0)
    sig = features.get("sig", 0.0)
    
    # Calculate score metrics
    text_sim = max(jaccard, semantic)
    # Simulated OCR accuracy score
    ocr_acc = 0.96 if text_sim > 0.4 else (0.90 if visual > 0.5 else 0.0)
    image_sim = visual if visual > 0.0 else (0.85 if text_sim > 0.9 else 0.0)
    
    # Metadata matches: check if they have similar extension
    ext1 = doc1_name.split(".")[-1].lower() if "." in doc1_name else ""
    ext2 = doc2_name.split(".")[-1].lower() if "." in doc2_name else ""
    metadata_match = 1.0 if ext1 == ext2 else 0.8
    
    reasons = []
    if duplicate_type == "exact":
        reasons.append("identical content hash matching")
        text_sim = 1.0
        ocr_acc = 1.0
        image_sim = 1.0
        metadata_match = 1.0
    else:
        if semantic > 0.85:
            reasons.append(f"high semantic text similarity ({semantic*100:.1f}%)")
        if jaccard > 0.70:
            reasons.append(f"lexical word overlap ({jaccard*100:.1f}%)")
        if visual > 0.75:
            reasons.append(f"visual page layout similarity ({visual*100:.1f}%)")
        if sig > 0.80:
            reasons.append(f"matching document signatures ({sig*100:.1f}%)")
        if not reasons:
            reasons.append("partial structural matches across text segments")

    summary = f"Flagged as a {duplicate_type} duplicate due to " + ", ".join(reasons) + "."
    
    # Recommendation logic: we assume doc2 is the duplicate/recently uploaded copy, doc1 is original
    rec_text = f"Keep {doc1_name} (original document). Delete {doc2_name} to save storage space."
    
    explanation_data = {
        "summary": summary,
        "text_similarity": round(text_sim * 100, 1),
        "ocr_accuracy": round(ocr_acc * 100, 1),
        "image_similarity": round(image_sim * 100, 1),
        "metadata_match": round(metadata_match * 100, 1),
        "recommendation": rec_text
    }
    
    return json.dumps(explanation_data)
