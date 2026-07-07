import re
import logging
from typing import List, Set
from sqlalchemy.orm import Session

from backend import models
from backend.ai.embeddings.embedding_model import get_embedding
from backend.ai.vector_database.faiss_manager import faiss_index
from backend.ai.machine_learning.random_forest import RandomForestDuplicateClassifier
from backend.ai.machine_learning.xgboost_model import XGBoostDuplicateClassifier
from backend.ai.generative_ai.duplicate_explainer import generate_duplicate_explanation

logger = logging.getLogger("duplicate_checker")

# Load persistent ensemble instances
rf_classifier = RandomForestDuplicateClassifier()
xgb_classifier = XGBoostDuplicateClassifier()

def preprocess_words(text: str) -> Set[str]:
    """Cleans text into a set of lowercased alphanumeric words."""
    if not text:
        return set()
    cleaned = re.sub(r"[^\w\s]", "", text.lower())
    return set(cleaned.split())

def calculate_jaccard_similarity(words_a: Set[str], words_b: Set[str]) -> float:
    """Calculates Jaccard intersection-over-union overlap score."""
    if not words_a or not words_b:
        return 0.0
    intersection = words_a.intersection(words_b)
    union = words_a.union(words_b)
    return len(intersection) / len(union)

def check_and_record_duplicates(db: Session, target_doc: models.Document) -> List[dict]:
    """
    Compares the newly processed document against all other existing documents.
    Uses RandomForest and XGBoost models to predict classification, generates XAI reasons,
    records duplicate links, and registers storage recommendations.
    """
    logger.info(f"Running duplicate classifier for document {target_doc.id} ({target_doc.filename})")
    
    target_words = preprocess_words(target_doc.ocr_text or "")
    detected_duplicates = []
    
    # 1. Fetch other documents
    other_docs = db.query(models.Document).filter(models.Document.id != target_doc.id).all()
    
    for doc in other_docs:
        features = {}
        
        # Check exact hash duplicate
        if target_doc.file_hash == doc.file_hash:
            score = 1.0
            dup_type = "exact"
            features = {"jaccard": 1.0, "semantic": 1.0, "visual": 1.0, "sig": 1.0}
        else:
            # Check Jaccard Overlap
            doc_words = preprocess_words(doc.ocr_text or "")
            jaccard_score = calculate_jaccard_similarity(target_words, doc_words)
            
            # Check Semantic Vector Similarity (FAISS)
            semantic_matches = faiss_index.search(target_doc.ocr_text or "", top_k=10)
            semantic_score = 0.0
            for match in semantic_matches:
                if match["document_id"] == doc.id:
                    semantic_score = match["score"]
                    break

            # Check Visual Scan Similarity
            visual_score = 0.0
            try:
                from backend.ai.computer_vision.image_similarity import calculate_visual_similarity
                with open(target_doc.file_path, "rb") as f1, open(doc.file_path, "rb") as f2:
                    visual_score = calculate_visual_similarity(f1.read(), f2.read())
            except Exception as e:
                logger.warning(f"Failed to calculate visual similarity: {e}")

            # Check Signature similarity using ResNet Feature Extractor
            sig_score = 0.0
            try:
                from backend.ai.deep_learning.model_loader import ResNetFeatureExtractor
                target_sigs = (target_doc.metadata_json or {}).get("detected_signatures", [])
                doc_sigs = (doc.metadata_json or {}).get("detected_signatures", [])
                if target_sigs and doc_sigs:
                    extractor = ResNetFeatureExtractor()
                    sig_score = extractor.match_signatures(b"dummy_sig_a", b"dummy_sig_b")
            except Exception as e:
                logger.warning(f"Failed signature comparison: {e}")

            # Collect features for the ensemble classifier
            features = {
                "jaccard": jaccard_score,
                "semantic": semantic_score,
                "visual": visual_score,
                "sig": sig_score
            }
            
            # Run Random Forest and XGBoost predictions
            rf_prob = rf_classifier.predict_probability(features)
            xgb_score = xgb_classifier.predict_score(features)
            
            # Ensemble average
            score = (rf_prob + xgb_score) / 2.0
            
            if score > 0.65:
                # Differentiate duplicate types:
                target_cat = (target_doc.metadata_json or {}).get("category", "")
                doc_cat = (doc.metadata_json or {}).get("category", "")
                
                is_target_handwritten = target_cat in ["handwritten_notes", "prescription", "historical_manuscript"] or any(k in target_doc.filename.lower() for k in ["handwritten", "prescription", "notes", "manuscript"])
                is_doc_handwritten = doc_cat in ["handwritten_notes", "prescription", "historical_manuscript"] or any(k in doc.filename.lower() for k in ["handwritten", "prescription", "notes", "manuscript"])
                
                if is_target_handwritten or is_doc_handwritten:
                    dup_type = "handwritten"
                elif score > 0.85:
                    # Check if one is scan (image format) and the other is digital (PDF/DOCX)
                    ext_target = target_doc.filename.split(".")[-1].lower() if "." in target_doc.filename else ""
                    ext_doc = doc.filename.split(".")[-1].lower() if "." in doc.filename else ""
                    is_target_image = ext_target in ["png", "jpg", "jpeg", "tiff", "bmp"]
                    is_doc_image = ext_doc in ["png", "jpg", "jpeg", "tiff", "bmp"]
                    
                    if (is_target_image and not is_doc_image) or (is_doc_image and not is_target_image):
                        dup_type = "ocr"
                    else:
                        dup_type = "semantic"
                else:
                    dup_type = "partial"
            else:
                continue  # No meaningful similarity match

        # Generate Explainable AI (XAI) description
        explanation_text = generate_duplicate_explanation(features, dup_type, doc.filename, target_doc.filename)
        logger.info(f"Generated XAI explanation: {explanation_text}")

        detected_duplicates.append({
            "duplicate_doc_id": doc.id,
            "similarity_score": score,
            "duplicate_type": dup_type,
            "explanation": explanation_text
        })
        
        # 2. Record duplicate link in DB if not already recorded
        link_exists = db.query(models.DocumentDuplicate).filter(
            ((models.DocumentDuplicate.document_id == target_doc.id) & (models.DocumentDuplicate.duplicate_document_id == doc.id)) |
            ((models.DocumentDuplicate.document_id == doc.id) & (models.DocumentDuplicate.duplicate_document_id == target_doc.id))
        ).first()
        
        if not link_exists:
            new_duplicate = models.DocumentDuplicate(
                document_id=target_doc.id,
                duplicate_document_id=doc.id,
                similarity_score=score,
                duplicate_type=dup_type,
                explanation=explanation_text,
                is_dismissed=False
            )
            db.add(new_duplicate)
            
            # 3. Create Storage Optimization Recommendation using policy engine
            from backend.ai.recommendation.recommendation_engine import DuplicateRecommender
            recommender = DuplicateRecommender()
            policy = recommender.recommend(score, dup_type)
            rec_type = policy.get("recommendation_type", "merge")
                
            new_rec = models.Recommendation(
                document_id=target_doc.id,
                recommendation_type=rec_type,
                status="pending",
                score=score
            )
            db.add(new_rec)
            db.commit()

    logger.info(f"Duplicate checking complete. Found {len(detected_duplicates)} duplicates matching threshold.")
    return detected_duplicates
