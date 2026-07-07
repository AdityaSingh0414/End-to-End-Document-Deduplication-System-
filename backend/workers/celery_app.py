import os
import logging
from celery import Celery
from backend.config import settings

logger = logging.getLogger("celery_app")

# Initialize Celery app
celery_app = Celery(
    "doc_intelligence_tasks",
    broker=settings.get_redis_url(),
    backend=settings.get_redis_url()
)

# Configuration settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Zero-configuration fallback: check if Redis is running, if not, enable "task_always_eager"
# which executes Celery tasks synchronously in the same thread.
# This makes the app run out-of-the-box without requiring running Redis/Celery background processes.
try:
    import redis
    r = redis.from_url(settings.get_redis_url())
    r.ping()
    logger.info("Celery connected to Redis broker successfully.")
except Exception:
    logger.warning("Redis broker not reachable. Falling back to eager mode (synchronous task execution).")
    celery_app.conf.update(
        task_always_eager=True,
        task_eager_propagates=True
    )

# Auto-discover tasks from backend.workers package
celery_app.autodiscover_tasks(["backend.workers"])
