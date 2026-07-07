import logging
from backend.ai.deep_learning.trocr_model import recognize_handwritten_manuscript

logger = logging.getLogger("handwritten_ocr")


class HandwrittenRecognizer:
    def __init__(self):
        logger.info("Initialized Handwritten manuscript OCR recognizer.")

    def transcribe(self, image_bytes: bytes) -> str:
        """
        Transcribes cursive manuscripts, prescriptions, notes, and signatures.
        """
        logger.info("Transcribing handwritten cursive strokes...")
        return recognize_handwritten_manuscript(image_bytes)
