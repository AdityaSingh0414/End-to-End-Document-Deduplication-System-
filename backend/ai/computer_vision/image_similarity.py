import logging
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger("image_similarity")


def calculate_visual_similarity(img_bytes_a: bytes, img_bytes_b: bytes) -> float:
    """
    Computes visual similarity between two document scans using Mean Squared Error (MSE)
    and structural pixel correlations.
    """
    logger.info("Computing visual similarity between scans...")
    if cv2 is None:
        logger.warning("OpenCV not available. Returning default zero match.")
        return 0.0
        
    try:
        # Decode both images
        nparr_a = np.frombuffer(img_bytes_a, np.uint8)
        nparr_b = np.frombuffer(img_bytes_b, np.uint8)
        
        img_a = cv2.imdecode(nparr_a, cv2.IMREAD_GRAYSCALE)
        img_b = cv2.imdecode(nparr_b, cv2.IMREAD_GRAYSCALE)
        
        if img_a is None or img_b is None:
            return 0.0
            
        # 1. Resize to uniform grid to align matrices
        grid_size = (512, 512)
        img_a = cv2.resize(img_a, grid_size)
        img_b = cv2.resize(img_b, grid_size)
        
        # 2. Compute Mean Squared Error (MSE)
        # MSE = sum of squared differences / total pixels
        diff = img_a.astype("float") - img_b.astype("float")
        mse = np.sum(diff ** 2) / float(img_a.shape[0] * img_a.shape[1])
        
        # Normalize MSE to a [0, 1] similarity score range
        # MSE = 0 means identical images (similarity = 1.0)
        # MSE > 65000 means fully inverted (similarity = 0.0)
        max_error = 255.0 ** 2
        similarity_mse = 1.0 - (mse / max_error)
        
        # 3. Compute Normalized Cross-Correlation (NCC)
        norm_a = (img_a - np.mean(img_a)) / (np.std(img_a) + 1e-5)
        norm_b = (img_b - np.mean(img_b)) / (np.std(img_b) + 1e-5)
        ncc = np.mean(norm_a * norm_b)
        
        # Combine metrics into single visual similarity score
        # Clip similarity between 0.0 and 1.0
        score = float((similarity_mse * 0.4) + (max(0.0, ncc) * 0.6))
        
        logger.info(f"Visual scan comparison finished. Similarity score: {score*100:.1f}%")
        return max(0.0, min(1.0, score))
        
    except Exception as e:
        logger.error(f"Visual similarity calculation failed: {e}")
        return 0.0
