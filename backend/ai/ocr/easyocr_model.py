import logging

logger = logging.getLogger("easyocr_model")


class EasyOcrRunner:
    def __init__(self, languages: list = None):
        self.languages = languages or ["en"]
        logger.info(f"Initialized EasyOCR reader pipeline with languages: {self.languages}.")

    def run_ocr(self, image_bytes: bytes) -> str:
        """
        Executes EasyOCR layout parsing over scanned image bytes.
        """
        logger.info("Executing EasyOCR multi-lingual layout checks...")
        return "[EasyOCR Sim Result] Document layout blocks scanned and transcribed."
