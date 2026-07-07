import logging
import numpy as np

logger = logging.getLogger("feature_engineering")


class DocumentFeatureEngineer:
    def __init__(self):
        self.max_size_ref = 10 * 1024 * 1024 # 10 MB reference scale
        self.max_words_ref = 5000.0
        logger.info("Initialized Document Feature Engineer.")

    def engineer_features(self, file_size_bytes: int, word_count: int, paragraphs_count: int, file_ext: str) -> list:
        """
        Processes document statistics into a normalized feature vector.
        Features engineered:
          - log-scaled size [0.0, 1.0]
          - normalized word ratio
          - average words per paragraph
          - format category index
        """
        logger.info("Engineering metadata features...")
        
        # 1. Log scale file size
        size_feat = float(min(1.0, np.log1p(file_size_bytes) / np.log1p(self.max_size_ref)))
        
        # 2. Word count ratio
        word_feat = float(min(1.0, word_count / self.max_words_ref))
        
        # 3. Words per paragraph density
        density = float(word_count / max(1, paragraphs_count))
        density_feat = float(min(1.0, density / 100.0)) # Scale by 100 max avg words
        
        # 4. File extension encoding
        ext = file_ext.lower().replace(".", "")
        if ext == "pdf":
            ext_feat = 0.0
        elif ext == "docx":
            ext_feat = 0.5
        else:
            ext_feat = 1.0
            
        vector = [size_feat, word_feat, density_feat, ext_feat]
        logger.info(f"Engineered numerical vector representation: {vector}")
        return vector
