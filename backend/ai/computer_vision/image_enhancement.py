import logging
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger("image_enhancement")


def enhance_document_image(image_bytes: bytes) -> bytes:
    """
    Enhances document image readability by applying:
      1. Bicubic Interpolation resizing (Super-Resolution for text).
      2. Laplacian sharpening masks.
      3. CLAHE (Contrast Limited Adaptive Histogram Equalization) contrast adjustment.
    """
    logger.info("Starting CV image enhancement operations...")
    if cv2 is None:
        logger.warning("OpenCV not available. Returning raw input bytes.")
        return image_bytes
        
    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes
            
        # 1. CLAHE Contrast balance (on luminance layer of LAB color space)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        # 2. Upscale (Super-Resolution) if under normal dimensions
        h, w = enhanced.shape[:2]
        if h < 1200 or w < 1200:
            enhanced = cv2.resize(enhanced, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
            
        # 3. Laplacian Sharpening Mask
        kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ], dtype=np.float32)
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        
        # Encode back to jpg
        success, encoded = cv2.imencode(".jpg", sharpened)
        if success:
            logger.info("Image enhancement operations completed successfully.")
            return encoded.tobytes()
        return image_bytes
        
    except Exception as e:
        logger.error(f"Image enhancement failed: {e}")
        return image_bytes
