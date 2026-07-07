import logging
import sys
from backend.config import settings

# Formatter
class ColoredFormatter(logging.Formatter):
    grey = "\x1b[38;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    green = "\x1b[32;20m"
    cyan = "\x1b[36;20m"
    
    format_str = "%(asctime)s - %(name)s - %(levelname)s - (%(filename)s:%(lineno)d) - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format_str + reset,
        logging.INFO: green + format_str + reset,
        logging.WARNING: yellow + format_str + reset,
        logging.ERROR: red + format_str + reset,
        logging.CRITICAL: bold_red + format_str + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)


def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Clean previous handlers
    if logger.hasHandlers():
        logger.handlers.clear()

    # Stream Handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(ColoredFormatter())
    logger.addHandler(stream_handler)
    
    # Fastapi/Uvicorn specific overrides if needed
    for uvicorn_logger in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(uvicorn_logger).handlers = logger.handlers
        logging.getLogger(uvicorn_logger).propagate = False

    logging.info(f"Logging initialized in {settings.ENV} mode (Level: {logging.getLevelName(log_level)})")


# Expose default log getter
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
