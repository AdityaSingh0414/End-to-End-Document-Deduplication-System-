import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.utils.logger import setup_logging, get_logger
from backend.utils.exceptions import AppBaseException
from backend.utils.logging_middleware import RequestLoggingMiddleware
from backend.database.session import engine
from backend.database.base_class import Base

from backend.api.auth import router as auth_router
from backend.api.upload import router as upload_router
from backend.api.search import router as search_router
from backend.api.duplicate import router as duplicate_router
from backend.api.analytics import router as analytics_router
from backend.websocket.router import router as ws_router

# Setup logger
setup_logging()
logger = get_logger("app_main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting up Document Deduplication System Backend...")
    try:
        # Create database tables automatically if they do not exist
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
    
    yield
    # Shutdown actions
    logger.info("Shutting down Document Deduplication System Backend...")


# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Document Deduplication System for semantic search, OCR, and document layout analysis.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",  # React Vite local dev server
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Request Logging Middleware
app.add_middleware(RequestLoggingMiddleware)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)
app.include_router(duplicate_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)


# Register Exception Handlers
@app.exception_handler(AppBaseException)
async def app_exception_handler(request: Request, exc: AppBaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please contact the administrator."}
    )


# Health Check endpoint
@app.get("/health", status_code=status.HTTP_200_OK, tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.ENV,
        "debug_mode": settings.DEBUG
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
