import logging
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger("qr_detection")

def detect_qr_codes(image_bytes: bytes) -> list:
    """
    Detects and decodes QR codes in scanned page image bytes using OpenCV QRCodeDetector.
    """
    logger.info("Executing QR code scanning analysis...")
    if not image_bytes or cv2 is None:
        logger.info("OpenCV not available or image bytes empty. Skipping QR detection.")
        return []
        
    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []
            
        detector = cv2.QRCodeDetector()
        
        # Try multi detection first (available in newer OpenCV versions)
        qr_codes = []
        if hasattr(detector, "detectAndDecodeMulti"):
            retval, decoded_info, points, _ = detector.detectAndDecodeMulti(img)
            if retval and points is not None:
                for info, pts in zip(decoded_info, points):
                    if info: # if decoded successfully
                        # pts is a 4x2 array of corners
                        x_min = int(np.min(pts[:, 0]))
                        y_min = int(np.min(pts[:, 1]))
                        w = int(np.max(pts[:, 0]) - x_min)
                        h = int(np.max(pts[:, 1]) - y_min)
                        qr_codes.append({
                            "payload": info,
                            "box": [x_min, y_min, w, h]
                        })
        
        # Fallback to single QR detector if multi found nothing or wasn't supported
        if not qr_codes:
            info, points, _ = detector.detectAndDecode(img)
            if info and points is not None:
                pts = points[0]
                x_min = int(np.min(pts[:, 0]))
                y_min = int(np.min(pts[:, 1]))
                w = int(np.max(pts[:, 0]) - x_min)
                h = int(np.max(pts[:, 1]) - y_min)
                qr_codes.append({
                    "payload": info,
                    "box": [x_min, y_min, w, h]
                })
                
        logger.info(f"Detected {len(qr_codes)} QR codes.")
        return qr_codes
        
    except Exception as e:
        logger.error(f"QR Code detection failed: {e}")
        return []
