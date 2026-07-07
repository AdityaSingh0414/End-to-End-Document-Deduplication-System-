import logging
from backend.ai.deep_learning.trocr_model import recognize_handwritten_manuscript

logger = logging.getLogger("trocr_model")


class TrOcrRunner:
    def __init__(self, model_name: str = "microsoft/trocr-base-handwritten"):
        self.model_name = model_name
        logger.info(f"Initialized TrOCR transformer model pipeline: {model_name}")

    def run_ocr(self, image_bytes: bytes) -> str:
        """
        Transcribes cursive text sequences from image crops using TrOCR.
        """
        logger.info("Executing TrOCR image sequence decoding...")
        return recognize_handwritten_manuscript(image_bytes)
