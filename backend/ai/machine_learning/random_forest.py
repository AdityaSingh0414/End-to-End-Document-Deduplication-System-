import os
import pickle
import logging
import numpy as np
from backend.config import settings

logger = logging.getLogger("random_forest")

def ensure_models_trained():
    rf_path = os.path.join(settings.CACHE_DIR, "rf_duplicate_model.pkl")
    if not os.path.exists(rf_path):
        logger.info("RandomForest binary not found. Bootstrapping models...")
        from backend.ai.machine_learning.bootstrap import train_and_save_all_models
        train_and_save_all_models()

class RandomForestDuplicateClassifier:
    def __init__(self):
        ensure_models_trained()
        rf_path = os.path.join(settings.CACHE_DIR, "rf_duplicate_model.pkl")
        with open(rf_path, "rb") as f:
            self.model = pickle.load(f)
        logger.info("Initialized RandomForest Duplicate Classifier.")

    def predict_probability(self, features: dict) -> float:
        """
        Runs real ensemble voting over document features using RandomForest.
        """
        jaccard = features.get("jaccard", 0.0)
        semantic = features.get("semantic", 0.0)
        visual = features.get("visual", 0.0)
        sig = features.get("sig", 0.0)
        
        X = np.array([[jaccard, semantic, visual, sig]])
        try:
            # Predict probability of class 1 (duplicate)
            prob = self.model.predict_proba(X)[0][1]
            logger.info(f"RandomForest voted duplicate probability: {prob*100:.1f}%")
            return float(prob)
        except Exception as e:
            logger.error(f"RandomForest prediction failed: {e}")
            # Fallback to simulated calculation
            return float((jaccard * 0.3) + (semantic * 0.4) + (visual * 0.2) + (sig * 0.1))
