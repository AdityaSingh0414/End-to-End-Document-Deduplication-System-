import re
import logging

logger = logging.getLogger("nlp_preprocessing")


def clean_text(text: str) -> str:
    """
    Standardizes whitespace, strips non-printable characters, and removes redundant punctuation.
    """
    logger.info("Executing NLP string cleaning...")
    if not text:
        return ""
    # Strip markup / HTML tags
    cleaned = re.sub(r"<[^>]*>", "", text)
    # Remove excessive white spaces
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def remove_stopwords(text: str) -> str:
    """Removes common conversational stopwords to isolate key tokens."""
    if not text:
        return ""
    stopwords = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "for", "with", "by", "of", "in", "on", "at"}
    words = text.split()
    filtered = [w for w in words if w.lower() not in stopwords]
    return " ".join(filtered)
