import logging
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger("stamp_detection")


def detect_stamps(image_bytes: bytes) -> list:
    """
    Detects ink stamp or logo boundary zones in scanned document image bytes using color segmentation.
    """
    logger.info("Executing stamp detection analysis...")
    if not image_bytes or cv2 is None:
        logger.info("OpenCV not available or image bytes empty. Skipping stamp detection.")
        return []
        
    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []
            
        # Convert to HSV color space
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Red ink mask (typically two ranges due to circular hue wrap-around)
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 50, 50])
        upper_red2 = np.array([180, 255, 255])
        
        mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
        mask_red = cv2.bitwise_or(mask_red1, mask_red2)
        
        # Purple/Violet/Magenta ink mask
        lower_purple = np.array([130, 40, 40])
        upper_purple = np.array([165, 255, 255])
        mask_purple = cv2.inRange(hsv, lower_purple, upper_purple)
        
        # Combined stamp color mask
        stamp_mask = cv2.bitwise_or(mask_red, mask_purple)
        
        # Morphological opening and closing to merge stamp regions
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        stamp_mask = cv2.morphologyEx(stamp_mask, cv2.MORPH_OPEN, kernel)
        stamp_mask = cv2.morphologyEx(stamp_mask, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(stamp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        stamps = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            area = cv2.contourArea(cnt)
            
            # Stamps/logos are typically circular, square, or rectangular blocks
            # Filter by area and aspect ratio (usually close to square or circle, aspect ratio 0.5 to 2.0)
            aspect_ratio = w / float(h) if h > 0 else 0
            if 300 < area < 150000 and 0.4 < aspect_ratio < 2.5:
                confidence = min(0.99, 0.7 + (area / 150000.0) * 0.25)
                stamps.append({
                    "box": [int(x), int(y), int(w), int(h)],
                    "confidence": round(confidence, 2)
                })
                
        logger.info(f"Detected {len(stamps)} stamp candidates.")
        return stamps
        
    except Exception as e:
        logger.error(f"Stamp detection failed: {e}")
        return []
