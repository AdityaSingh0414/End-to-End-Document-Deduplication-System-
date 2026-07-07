import logging
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger("barcode_detection")

def detect_barcodes(image_bytes: bytes) -> list:
    """
    Detects and decodes/locates barcodes in scanned page image bytes using OpenCV.
    """
    logger.info("Executing barcode scanning analysis...")
    if not image_bytes or cv2 is None:
        logger.info("OpenCV not available or image bytes empty. Skipping barcode detection.")
        return []
        
    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []
            
        barcodes = []
        
        # 1. Try OpenCV's built-in BarcodeDetector if available (OpenCV 4.5.2+)
        if hasattr(cv2, "barcode") and hasattr(cv2.barcode, "BarcodeDetector"):
            try:
                detector = cv2.barcode.BarcodeDetector()
                retval, decoded_info, decoded_type, points = detector.detectAndDecode(img)
                if retval and points is not None:
                    for info, btype, pts in zip(decoded_info, decoded_type, points):
                        if info:
                            x_min = int(np.min(pts[:, 0]))
                            y_min = int(np.min(pts[:, 1]))
                            w = int(np.max(pts[:, 0]) - x_min)
                            h = int(np.max(pts[:, 1]) - y_min)
                            barcodes.append({
                                "code": info,
                                "type": btype or "UPC/EAN",
                                "box": [x_min, y_min, w, h]
                            })
            except Exception as ex:
                logger.warning(f"Built-in BarcodeDetector failed/unavailable: {ex}")
                
        # 2. Heuristic contour-based localization fallback (finds candidate barcode bounding boxes)
        if not barcodes:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Compute Scharr gradient representation to highlight vertical edges (barcodes)
            gradX = cv2.Sobel(gray, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
            gradY = cv2.Sobel(gray, ddepth=cv2.CV_32F, dx=0, dy=1, ksize=-1)
            gradient = cv2.subtract(gradX, gradY)
            gradient = cv2.convertScaleAbs(gradient)
            
            # Blur and threshold
            blurred = cv2.blur(gradient, (9, 9))
            _, thresh = cv2.threshold(blurred, 225, 255, cv2.THRESH_BINARY)
            
            # Close gaps between barcode lines (morphological close)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            # Perform series of erosions and dilations to clean noise
            closed = cv2.erode(closed, None, iterations=4)
            closed = cv2.dilate(closed, None, iterations=4)
            
            # Find contours
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                area = cv2.contourArea(cnt)
                aspect_ratio = w / float(h) if h > 0 else 0
                
                # Barcodes are typically wider than they are tall (aspect ratio usually > 1.5)
                if area > 1000 and 1.5 < aspect_ratio < 6.0:
                    barcodes.append({
                        "code": "Detected Barcode Block",
                        "type": "Localized",
                        "box": [int(x), int(y), int(w), int(h)]
                    })
                    
        logger.info(f"Detected {len(barcodes)} barcodes.")
        return barcodes
        
    except Exception as e:
        logger.error(f"Barcode detection failed: {e}")
        return []
