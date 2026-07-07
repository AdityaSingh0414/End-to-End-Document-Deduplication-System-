# Enterprise AI Document Intelligence System

A high-performance document processing, character recognition (OCR), semantic search, and storage deduplication platform built with a FastAPI backend and a Vite React + TS glassmorphic frontend.

---

## Technical Stack Overview

### Backend & AI Processing Engine
- **Core API**: FastAPI (ASGI) with modular routers
- **Database Engine**: SQLAlchemy with SQLite out-of-the-box (zero-config SQL support)
- **Vector Search Engine**: FAISS (Facebook AI Similarity Search) flat indexes
- **Text & Layout Parsers**: PDF digital text extraction via `pypdf`, DOCX tables/text extraction via `python-docx`
- **OCR Engine**: Simulated text-segment layout scanner with integration-ready hooks for EasyOCR & PaddleOCR
- **Deduplication Engine**: Multi-metric classifier checks (Exact SHA-256 Hashes, Jaccard Keyword overlaps, Vector Cosine similarities)
- **Background Worker**: Celery task structure with auto-eager synchronous fallback (keeps ingestion functional without Redis)
- **Real-Time Notification**: ASGI WebSocket broadcast channels

### Frontend Dashboard Client
- **Framework**: React + TypeScript scaffolded via Vite
- **State Management**: Redux Toolkit (Auth and Document pools)
- **Visual styling**: Custom glassmorphism variables (CSS layout styling, hover micro-animations)
- **Data Visualizations**: Recharts charting reports (format, status, and language percentages)
- **Icons**: Lucide Icons library

---

## Directory Architecture Map

```
├── backend/
│   ├── api/                   # Auth (JWT), Ingestion, Semantic Search, Deduplication, and Analytics routes
│   ├── config/                # Settings loaders (defaults to local SQLite in development)
│   ├── core/                  # Security (direct bcrypt hashing), Exceptions, Logging formatter
│   ├── database/              # session connections, base ORM model class, database models
│   ├── middleware/            # request-timing logging middlewares
│   ├── storage/               # Abstract filesystem storage interface (LocalStorage)
│   ├── websocket/             # WebSocket connections and broadcast manager
│   ├── workers/               # Celery app configuration and background task runner
│   └── main.py                # FastAPI boot entry point
│
├── ai/
│   ├── ocr/                   # PDF/Word text extractors, simulated OCR scans pipeline
│   ├── vector_search/         # Embedding generators, local FAISS vector store manager
│   └── machine_learning/      # duplicate similarity classifier checks (hash, Jaccard, semantic)
│
├── frontend/                  # React Vite Single Page App
│   ├── public/                # Web manifest, icons
│   ├── src/
│   │   ├── app/               # Root App, MainLayout container shell, Router paths
│   │   ├── components/        # ui widgets
│   │   ├── pages/             # Login, Dashboard, UploadCenter, OCRStudio, DuplicateCenter, SemanticSearch, AIChat, Analytics, VectorDatabase, Settings
│   │   ├── services/          # HTTP API client services (auth, upload, search, duplicate, analytics)
│   │   ├── store/             # Redux state slices (authSlice, documentSlice)
│   │   ├── lib/               # axios base config, websocket auto-reconnector helper
│   │   └── styles/            # globals.css, animations.css (glassmorphism design tokens)
│   └── package.json
│
├── doc_intelligence.db        # In-memory/SQLite file containing schemas and tables
├── run.py                     # Root orchestrator script
└── task.md                    # Task tracker document
```

---

## Operating Instructions

### Prerequisites
1. Python 3.10+
2. Node.js 18+

### Setup and Ingestion

1. **Backend Database Setup**:
   Ensure you have configured the local virtual environment and seeded the SQLite tables:
   ```bash
   # Activate virtual env (Windows)
   .\venv\Scripts\activate
   
   # Seed tables and admin account
   python -m backend.database.init_db
   ```

2. **Frontend Packages**:
   Install Vite node dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Start System Concurrently
Run the master orchestrator script from the root workspace folder:
```bash
python run.py
```
This spawns:
- **FastAPI Backend Server**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Vite React Dev Server**: [http://localhost:5173](http://localhost:5173) (or next available port)

### Run Exploratory ML/CV pipeline Demos
To run a command-line demonstration of the system's underlying NLP, Computer Vision, OCR, and Jaccard vs. Semantic similarity checks, run:
```bash
python experiments/pipeline_demo.py
```

---

## Default Admin Credentials
To log into the administrator controls, use the seeded system operator profile:
- **Email**: `admin@enterprise.ai`
- **Password**: `admin123`
