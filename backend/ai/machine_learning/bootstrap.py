import os
import pickle
import logging
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
from backend.config import settings

logger = logging.getLogger("ml_bootstrap")
logging.basicConfig(level=logging.INFO)

def train_and_save_all_models():
    os.makedirs(settings.CACHE_DIR, exist_ok=True)
    
    # 1. Document Category Classifier (TfidfVectorizer + MultinomialNB)
    logger.info("Training Category Classifier...")
    categories = [
        "prescription", "historical_manuscript", "handwritten_notes", 
        "invoice", "legal_agreement", "scientific_report"
    ]
    texts = [
        # Prescriptions
        "Rx Paracetamol 500mg take twice daily for fever doctor prescription",
        "Medicine prescription 1 tablet before dinner patient needs rest",
        "Rx Amoxicillin capsules pharmacy prescription refilled by doctor",
        # Historical Manuscripts
        "Historical manuscript fragment from the 17th century guildhall archives",
        "Ancient medieval text parchment translation of historical documents",
        "Old handwriting historical script found in parish record library",
        # Handwritten Notes
        "My handwritten notes from the lecture chemistry exam study guide",
        "Scrawled meeting notebook journal entry quick sketches ideas page",
        "Personal diary notes written by hand detailing the morning events",
        # Invoices
        "Invoice receipt total amount due price billing statement order 523",
        "Tax invoice payment transaction details total charges shipping fee",
        "Purchase receipt balance paid invoice breakdown unit price",
        # Legal Agreements
        "This legal contract agreement signed between the parties signatory",
        "Partnership terms conditions contract lease agreement witness copy",
        "Non-disclosure agreement NDA legal binding signature clauses",
        # Scientific Reports
        "Scientific research paper journal article experimental results table",
        "Lab data analysis figures graph scientific hypothesis conclusion",
        "Technical report engineering design specification analysis dataset"
    ]
    labels = [
        "prescription", "prescription", "prescription",
        "historical_manuscript", "historical_manuscript", "historical_manuscript",
        "handwritten_notes", "handwritten_notes", "handwritten_notes",
        "invoice", "invoice", "invoice",
        "legal_agreement", "legal_agreement", "legal_agreement",
        "scientific_report", "scientific_report", "scientific_report"
    ]
    # Multiply training data to make it robust
    train_texts = texts * 5
    train_labels = labels * 5
    
    category_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(lowercase=True, stop_words='english')),
        ('clf', MultinomialNB())
    ])
    category_pipeline.fit(train_texts, train_labels)
    
    cat_path = os.path.join(settings.CACHE_DIR, "category_classifier.pkl")
    with open(cat_path, "wb") as f:
        pickle.dump(category_pipeline, f)
    logger.info(f"Saved category classifier to {cat_path}")

    # 2. Processing Latency Regressor (LinearRegression)
    logger.info("Training Latency Regressor...")
    # Features: [file_size_kb]
    X_lat = np.array([10, 50, 100, 500, 1000, 5000, 10000]).reshape(-1, 1)
    # y: processing latency in seconds (roughly 0.5 + 0.1 * size_kb)
    y_lat = 0.5 + (X_lat.flatten() * 0.1) + np.random.normal(0, 0.05, len(X_lat))
    
    latency_model = LinearRegression()
    latency_model.fit(X_lat, y_lat)
    
    lat_path = os.path.join(settings.CACHE_DIR, "latency_regressor.pkl")
    with open(lat_path, "wb") as f:
        pickle.dump(latency_model, f)
    logger.info(f"Saved latency regressor to {lat_path}")

    # 3. Random Forest Duplicate Classifier
    logger.info("Training Random Forest Duplicate Classifier...")
    # Features: [jaccard, semantic, visual, sig]
    X_dup = np.array([
        [1.0, 1.0, 1.0, 1.0],      # Exact duplicate
        [0.9, 0.85, 0.8, 0.9],     # Very similar duplicate
        [0.8, 0.9, 0.7, 0.1],      # Partial semantic duplicate
        [0.0, 0.1, 0.0, 0.0],      # Entirely different
        [0.1, 0.2, 0.15, 0.0],     # Low similarity
        [0.3, 0.4, 0.25, 0.1],     # Medium similarity (non-duplicate)
        [0.7, 0.75, 0.65, 0.8],    # Duplicate
        [0.2, 0.3, 0.1, 0.0]       # Non-duplicate
    ])
    y_dup = np.array([1, 1, 1, 0, 0, 0, 1, 0]) # 1: duplicate, 0: not duplicate
    
    # Bootstrap dataset with some noise
    np.random.seed(42)
    X_dup_large = np.vstack([X_dup] * 10)
    # add small noise
    X_dup_large += np.random.normal(0, 0.05, X_dup_large.shape)
    X_dup_large = np.clip(X_dup_large, 0.0, 1.0)
    y_dup_large = np.concatenate([y_dup] * 10)
    
    rf_model = RandomForestClassifier(n_estimators=20, random_state=42)
    rf_model.fit(X_dup_large, y_dup_large)
    
    rf_path = os.path.join(settings.CACHE_DIR, "rf_duplicate_model.pkl")
    with open(rf_path, "wb") as f:
        pickle.dump(rf_model, f)
    logger.info(f"Saved Random Forest duplicate classifier to {rf_path}")

    # 4. XGBoost Duplicate Classifier
    logger.info("Training XGBoost Duplicate Classifier...")
    # Using XGBClassifier
    xgb_model = xgb.XGBClassifier(
        n_estimators=15, 
        max_depth=3, 
        learning_rate=0.1, 
        random_state=42
    )
    xgb_model.fit(X_dup_large, y_dup_large)
    
    xgb_path = os.path.join(settings.CACHE_DIR, "xgb_duplicate_model.pkl")
    with open(xgb_path, "wb") as f:
        pickle.dump(xgb_model, f)
    logger.info(f"Saved XGBoost duplicate classifier to {xgb_path}")

if __name__ == "__main__":
    train_and_save_all_models()
