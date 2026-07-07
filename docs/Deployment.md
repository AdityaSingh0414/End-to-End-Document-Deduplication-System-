# Deployment Guide

Follow these steps to deploy the Document Deduplication System.

## Requirements
- Python 3.10+
- Node.js & npm (for the React frontend)
- Redis server (Celery broker)
- Qdrant (Optional: vector search cloud deployment)

## Local Development Startup

1. **Configure Environment Variables**:
   - Copy `.env.example` to `.env` and set parameters.
2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Install Frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
4. **Boot Backend and Frontend Orchestrator**:
   ```bash
   python run.py
   ```

## Production Deployment (Docker Compose)

1. **Build and start containers**:
   ```bash
   docker-compose up --build -d
   ```
2. **Inspect status**:
   - FastAPI REST API listens to port `8000`.
   - React SPA application listens to port `3000`.
