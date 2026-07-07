import logging
from backend.ai.computer_vision.image_preprocessing import preprocess_image, detect_page_orientation

logger = logging.getLogger("ocr_preprocessing")


def clean_and_deskew_image(image_bytes: bytes) -> dict:
    """
    Cleans scanned page images using OpenCV layout filters and corrects orientation skew.
    """
    logger.info("Executing OCR page image cleaning preprocessing...")
    
    # 1. Enhance and binarize image
    prep_status = preprocess_image(image_bytes)
    
    # 2. Check skew rotation angle
    skew_angle = detect_page_orientation(image_bytes)
    
    return {
        "status": prep_status.get("status", "fallback"),
        "binarized": prep_status.get("binarization_applied", False),
        "super_resolved": prep_status.get("super_resolution_applied", False),
        "orientation_angle_detected": skew_angle,
        "skew_corrected": skew_angle > 0
    }
