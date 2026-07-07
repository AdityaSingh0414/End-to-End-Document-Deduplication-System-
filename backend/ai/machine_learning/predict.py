import os
import pickle
import logging
import numpy as np
from backend.config import settings

logger = logging.getLogger("ml_inference")

def ensure_models_trained():
    cat_path = os.path.join(settings.CACHE_DIR, "category_classifier.pkl")
    lat_path = os.path.join(settings.CACHE_DIR, "latency_regressor.pkl")
    if not os.path.exists(cat_path) or not os.path.exists(lat_path):
        logger.info("ML model binaries not found. Bootstrapping/training ML models...")
        from backend.ai.machine_learning.bootstrap import train_and_save_all_models
        train_and_save_all_models()

class KeywordNaiveBayesClassifier:
    def __init__(self):
        ensure_models_trained()
        cat_path = os.path.join(settings.CACHE_DIR, "category_classifier.pkl")
        with open(cat_path, "rb") as f:
            self.model = pickle.load(f)

    def predict(self, text: str) -> dict:
        if not text:
            return {"predicted_category": "scientific_report", "confidence": 0.5}
        try:
            pred = self.model.predict([text])[0]
            # Get probability/confidence
            probs = self.model.predict_proba([text])[0]
            classes = self.model.classes_
            class_idx = list(classes).index(pred)
            confidence = float(probs[class_idx])
            return {"predicted_category": pred, "confidence": round(confidence, 2)}
        except Exception as e:
            logger.error(f"Naive Bayes classification failed: {e}")
            return {"predicted_category": "scientific_report", "confidence": 0.5}

class FileAnomalyDetector:
    def inspect_file(self, file_size: int, char_count: int) -> dict:
        reasons = []
        is_anomaly = False
        if file_size > 10 * 1024 * 1024:
            is_anomaly = True
            reasons.append("File size exceeds 10MB limit")
        if char_count < 10:
            is_anomaly = True
            reasons.append("Character count is suspiciously low")
        return {"is_anomaly": is_anomaly, "reasons": reasons}

class ProcessingLatencyRegressor:
    def __init__(self):
        ensure_models_trained()
        lat_path = os.path.join(settings.CACHE_DIR, "latency_regressor.pkl")
        with open(lat_path, "rb") as f:
            self.model = pickle.load(f)

    def predict_latency(self, file_size_bytes: int) -> float:
        try:
            size_kb = file_size_bytes / 1024.0
            X = np.array([[size_kb]])
            pred_lat = self.model.predict(X)[0]
            return float(max(0.1, pred_lat))
        except Exception as e:
            logger.error(f"Latency prediction failed: {e}")
            return 0.5 + (file_size_bytes / 1024.0) * 0.1

# Load persistent wrappers lazily or on import
classifier = KeywordNaiveBayesClassifier()
anomaly_detector = FileAnomalyDetector()

def predict_document_properties(text: str, file_size_bytes: int) -> dict:
    """
    Predicts both category classification and flags layout anomalies.
    """
    logger.info("Executing pipeline inference...")
    
    # Run classification
    cls_results = classifier.predict(text)
    
    # Run anomaly check
    char_count = len(text) if text else 0
    anomaly_results = anomaly_detector.inspect_file(file_size_bytes, char_count)
    
    return {
        "predicted_category": cls_results["predicted_category"],
        "confidence": cls_results["confidence"],
        "is_anomaly": anomaly_results["is_anomaly"],
        "anomaly_reasons": anomaly_results["reasons"]
    }
