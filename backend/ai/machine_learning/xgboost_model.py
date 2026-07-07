import os
import pickle
import logging
import numpy as np
from backend.config import settings

logger = logging.getLogger("xgboost_model")

def ensure_models_trained():
    xgb_path = os.path.join(settings.CACHE_DIR, "xgb_duplicate_model.pkl")
    if not os.path.exists(xgb_path):
        logger.info("XGBoost binary not found. Bootstrapping models...")
        from backend.ai.machine_learning.bootstrap import train_and_save_all_models
        train_and_save_all_models()

class XGBoostDuplicateClassifier:
    def __init__(self):
        ensure_models_trained()
        xgb_path = os.path.join(settings.CACHE_DIR, "xgb_duplicate_model.pkl")
        with open(xgb_path, "rb") as f:
            self.model = pickle.load(f)
        logger.info("Initialized XGBoost Boosted Trees Duplicate Classifier.")

    def predict_score(self, features: dict) -> float:
        """
        Runs gradient boosted decision trees prediction.
        """
        jaccard = features.get("jaccard", 0.0)
        semantic = features.get("semantic", 0.0)
        visual = features.get("visual", 0.0)
        sig = features.get("sig", 0.0)
        
        X = np.array([[jaccard, semantic, visual, sig]])
        try:
            # Predict probability of duplicate (class 1)
            prob = self.model.predict_proba(X)[0][1]
            logger.info(f"XGBoost predicted duplicate score: {prob*100:.1f}%")
            return float(prob)
        except Exception as e:
            logger.error(f"XGBoost prediction failed: {e}")
            # Fallback to simulated calculation
            return float((jaccard * 0.25) + (semantic * 0.45) + (visual * 0.3))
