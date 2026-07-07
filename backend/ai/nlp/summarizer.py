import logging
from backend.ai.nlp.preprocessing_pipeline import generate_extractive_summary

logger = logging.getLogger("nlp_summarization")


class TextSummarizer:
    def __init__(self):
        logger.info("Initialized Text Summarizer.")

    def summarize(self, text: str, sentences_limit: int = 2) -> str:
        """
        Extracts key sentences matching highest informational weights.
        """
        logger.info(f"Summarizing text to {sentences_limit} sentences.")
        return generate_extractive_summary(text, sentences_limit)
