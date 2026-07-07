import logging
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger("signature_detection")


def detect_signatures(image_bytes: bytes) -> list:
    """
    Detects handwritten signature bounding boxes in document image bytes using color thresholding and contour analysis.
    """
    logger.info("Executing signature detection search...")
    if not image_bytes or cv2 is None:
        logger.info("OpenCV not available or image bytes empty. Skipping signature detection.")
        return []
        
    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []
            
        h, w, _ = img.shape
        # Convert to HSV color space
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Segment blue ink (commonly used for handwritten signatures)
        lower_blue = np.array([90, 50, 50])
        upper_blue = np.array([135, 255, 255])
        blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
        
        # Apply morphological opening to filter out noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        blue_mask = cv2.morphologyEx(blue_mask, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(blue_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        signatures = []
        for cnt in contours:
            x_b, y_b, w_b, h_b = cv2.boundingRect(cnt)
            area = cv2.contourArea(cnt)
            
            # Signature bounding box heuristics
            # Area should be reasonable, aspect ratio should be wider than tall
            aspect_ratio = w_b / float(h_b) if h_b > 0 else 0
            if 100 < area < 100000 and 1.2 < aspect_ratio < 10.0:
                # Calculate simple confidence based on size/aspect ratio
                confidence = min(0.99, 0.6 + (area / 100000.0) * 0.3)
                signatures.append({
                    "box": [int(x_b), int(y_b), int(w_b), int(h_b)],
                    "confidence": round(confidence, 2)
                })
                
        # If no blue signatures found, fallback check bottom third of the image for dark/black signatures
        if not signatures:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Threshold to get dark pixels
            _, dark_mask = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)
            
            # Restrict to bottom 30% of image height where signatures usually sit
            bottom_y = int(h * 0.7)
            bottom_mask = np.zeros_like(dark_mask)
            bottom_mask[bottom_y:, :] = dark_mask[bottom_y:, :]
            
            contours, _ = cv2.findContours(bottom_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                x_b, y_b, w_b, h_b = cv2.boundingRect(cnt)
                area = cv2.contourArea(cnt)
                aspect_ratio = w_b / float(h_b) if h_b > 0 else 0
                if 200 < area < 50000 and 1.5 < aspect_ratio < 8.0:
                    signatures.append({
                        "box": [int(x_b), int(y_b), int(w_b), int(h_b)],
                        "confidence": 0.85
                    })
                    break  # Keep the primary signature match
                    
        logger.info(f"Detected {len(signatures)} signature candidates.")
        return signatures
        
    except Exception as e:
        logger.error(f"Signature detection failed: {e}")
        return []
