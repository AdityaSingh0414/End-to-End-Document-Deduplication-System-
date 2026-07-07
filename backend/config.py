import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Set cache directories inside the project to prevent downloading models outside
os.environ["HF_HOME"] = str(BASE_DIR / "storage_data" / "cache" / "huggingface")
os.environ["SENTENCE_TRANSFORMERS_HOME"] = str(BASE_DIR / "storage_data" / "cache" / "sentence_transformers")



class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Document Deduplication System"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = Field(default="SUPER_SECRET_DEV_KEY_CHANGE_IN_PRODUCTION", description="Secret key for JWT generation")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days
    ALGORITHM: str = "HS256"

    # Database (PostgreSQL)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "doc_intelligence"
    DATABASE_URL: Optional[str] = None

    # Cache & Broker (Redis)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: str = "6379"
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None

    # Kafka Config
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_INGESTION: str = "document-ingestion"

    # Vector Storage
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    VECTOR_DIMENSION: int = 384  # e.g. for sentence-transformers/all-MiniLM-L6-v2

    # Local File Storage
    UPLOAD_DIR: str = str(BASE_DIR / "storage_data" / "uploads")
    PROCESSED_DIR: str = str(BASE_DIR / "storage_data" / "processed")
    CACHE_DIR: str = str(BASE_DIR / "storage_data" / "cache")

    # MLOps Settings
    MLFLOW_TRACKING_URI: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.ENV == "development":
            return f"sqlite:///{BASE_DIR}/doc_intelligence.db"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    def get_qdrant_url(self) -> str:
        if self.QDRANT_URL:
            return self.QDRANT_URL
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"


# Create storage directories automatically
settings = Settings()
for path_str in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.CACHE_DIR]:
    Path(path_str).mkdir(parents=True, exist_ok=True)
