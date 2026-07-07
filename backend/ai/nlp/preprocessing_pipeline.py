import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger("nlp_processor")


def detect_language_code(text: str) -> str:
    """
    Detects language based on character script checking.
    Supports English, Hindi, Punjabi, Urdu, French, German, Japanese, Chinese.
    """
    if not text:
        return "en"
        
    # Heuristics checking character ranges
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"  # Hindi (Devanagari)
    if re.search(r"[\u0A00-\u0A7F]", text):
        return "pa"  # Punjabi (Gurmukhi)
    if re.search(r"[\u0600-\u06FF]", text):
        return "ur"  # Urdu (Arabic script)
    if re.search(r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]", text):
        # Checks Hiragana/Katakana/Japanese Kanji
        if re.search(r"[\u3040-\u309F\u30A0-\u30FF]", text):
            return "ja"  # Japanese
        return "zh"  # Chinese Hanzi
        
    # Check European keywords
    text_lower = text.lower()
    french_words = [" le ", " la ", " les ", " et ", " est ", " pour ", " dans "]
    german_words = [" der ", " die ", " das ", " und ", " ist ", " für ", " in "]
    
    if any(fw in text_lower for fw in french_words):
        return "fr"
    if any(gw in text_lower for gw in german_words):
        return "de"
        
    return "en"


def extract_named_entities(text: str) -> Dict[str, List[str]]:
    """
    Extracts Named Entities (NER) from plain text.
    Finds: Personnel Names, Companies, Monetary Values, Locations, Dates.
    """
    entities = {
        "organizations": [],
        "people": [],
        "values": [],
        "dates": []
    }
    
    if not text:
        return entities
        
    # Simple regex rules to show capability out-of-the-box
    # Companies ending with Inc, Corp, Ltd, Co
    companies = re.findall(r"\b([A-Z][a-zA-Z0-9&]* (?:\bInc\b|\bCorp\b|\bLtd\b|\bCo\b|\bSystems\b))\b", text)
    entities["organizations"] = list(set(companies))
    
    # Financial values
    values = re.findall(r"(\$[0-9,]+(?:\.[0-9]+)?|€[0-9,]+|₹[0-9,]+)", text)
    entities["values"] = list(set(values))
    
    # ISO Dates
    dates = re.findall(r"(\b\d{4}-\d{2}-\d{2}\b)", text)
    entities["dates"] = list(set(dates))
    
    # Simple personnel names pattern (e.g. Dr. John Doe, auditor Sarah Jenkins)
    people = re.findall(r"\b(?:Dr\.|Mr\.|Mrs\.|auditor|audited by)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b", text)
    entities["people"] = list(set(people))
    
    return entities


def extract_keywords_list(text: str, top_k: int = 5) -> List[str]:
    """
    Extracts frequency-ranked keywords, filtering common stopwords.
    """
    if not text:
        return []
        
    words = re.findall(r"\b\w{4,}\b", text.lower()) # words with 4+ chars
    stopwords = {"this", "that", "with", "from", "your", "have", "were", "been", "will", "here", "there", "about"}
    filtered_words = [w for w in words if w not in stopwords]
    
    # Rank by frequency
    counts = {}
    for w in filtered_words:
        counts[w] = counts.get(w, 0) + 1
        
    sorted_words = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return [word for word, count in sorted_words[:top_k]]


def generate_extractive_summary(text: str, max_sentences: int = 2) -> str:
    """
    Generates a brief summary by selecting key informational sentences.
    """
    if not text:
        return ""
        
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= max_sentences:
        return " ".join(sentences)
        
    # Simple sentence rank based on length and entity matches
    ranked = []
    for s in sentences:
        score = len(s)
        # Give higher weight to sentences mentioning metadata or statistics
        if any(keyword in s.lower() for keyword in ["total", "date", "report", "statement", "acquired", "verified"]):
            score += 100
        ranked.append((s, score))
        
    ranked.sort(key=lambda x: x[1], reverse=True)
    selected = [item[0] for item in ranked[:max_sentences]]
    return " ".join(selected)


def analyze_grammar_rules(text: str) -> List[Dict[str, Any]]:
    """
    Scans text for common layout and grammar discrepancies.
    """
    discrepancies = []
    if not text:
        return discrepancies
        
    # Check for duplicate consecutive words (e.g. "the the")
    dup_words = re.finditer(r"\b(\w+)\s+\1\b", text, re.IGNORECASE)
    for match in dup_words:
        discrepancies.append({
            "error_type": "consecutive_duplicate_words",
            "text": match.group(0),
            "position": match.start()
        })
        
    # Check for sentence spacing issues
    spacing = re.finditer(r"[.!?][A-Za-z]", text)
    for match in spacing:
        discrepancies.append({
            "error_type": "missing_space_after_punctuation",
            "text": match.group(0),
            "position": match.start()
        })
        
    return discrepancies
