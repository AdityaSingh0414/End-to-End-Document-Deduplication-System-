# Document Deduplication System

A document deduplication and semantic search platform with OCR, duplicate detection, and a React-based dashboard.

---

## Technical Stack Overview

### Backend & AI Processing Engine
- **Core API**: FastAPI (ASGI) with modular routers
- **Database Engine**: SQLAlchemy with local SQLite support
- **Vector Search Engine**: FAISS-style vector search integration
- **Text Parsers**: PDF and DOCX extraction support
- **OCR Engine**: OCR pipeline with simulated metadata and integration hooks
- **Deduplication Engine**: Multi-metric duplicate detection using hashes, keyword similarity, and semantic similarity
- **Background Worker**: Celery task structure with optional Redis integration
- **Realtime**: WebSocket support for API notifications

### Frontend Dashboard Client
- **Framework**: React + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Visual Styling**: Glassmorphism UI design
- **Data Visualization**: Recharts charts and analytics panels
- **Icons**: Lucide Icons

---

## Directory Architecture Map

```
├── backend/
│   ├── api/                   # FastAPI routers for auth, upload, search, duplicates, analytics, recommendations
│   ├── app/                   # Backend application and dependency wiring
│   ├── ai/                    # AI processing layers for OCR, embeddings, and ML models
│   ├── config.py              # Pydantic settings and environment configuration
│   ├── database/              # SQLAlchemy session, base classes, models, and seed script
│   ├── models/                # ORM model definitions
│   ├── websocket/             # WebSocket router and manager
│   ├── workers/               # Celery app configuration and background tasks
│   ├── utils/                 # Logging, security, exceptions, helpers
│   └── main.py                # FastAPI application entry point
│
├── frontend/                  # React Vite Single Page App
│   ├── public/                # Static assets and icons
│   ├── src/
│   │   ├── app/               # Root app layout and routing
│   │   ├── components/        # UI components
│   │   ├── pages/             # Login, Dashboard, Upload, OCR, Duplicate Center, Search, Chat, Analytics
│   │   ├── services/          # API client service modules
│   │   ├── store/             # Redux slices and store configuration
│   │   ├── lib/               # Utilities and axios configuration
│   │   └── styles/            # Global styles and theme tokens
│   └── package.json
│
├── doc_intelligence.db        # SQLite database file for local development
├── run.py                     # Root orchestrator script for backend + frontend
└── requirements.txt           # Python dependencies
```

---

## Operating Instructions

### GitHub Push Checklist
1. **Keep secrets out of version control**
   - Do not commit `.env`, API keys, passwords, tokens, or private credentials.
   - This repo includes `.env.example` for safe local setup.
2. **Use `.gitignore` correctly**
   - The project already ignores `venv/`, `node_modules/`, build outputs, caches, logs, and editor folders.
3. **Avoid large or private files**
   - Do not commit datasets, trained models, backups, or other large generated files.
4. **Include a LICENSE**
   - A `LICENSE` file is included in the repo to clarify usage terms.
5. **Review before publishing**
   - Confirm no sensitive or personal files are present and that only source code and necessary config is committed.

### Prerequisites
1. Python 3.10+
2. Node.js 18+

### Backend Setup
1. Activate the local Python virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Seed the database and create the default admin user:
   ```bash
   python -m backend.database.seed
   ```

### Frontend Setup
1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Start the Application
From the repository root, run:
```bash
python run.py
```
This starts:
- **FastAPI backend** at `http://127.0.0.1:8000`
- **Vite frontend** at `http://localhost:5173`

If you prefer to run backend and frontend separately:
- Backend only:
  ```bash
  python backend/main.py
  ```
- Frontend only:
  ```bash
  cd frontend
  npm run dev
  ```

---

## Default Admin Credentials
- **Email**: `admin@enterprise.ai`
- **Password**: `admin123`

---

## Notes
- The backend uses `backend.config.Settings` to configure local paths, database URLs, and environment settings.
- The frontend is a Vite React app and can be started independently if needed.
- There is no `experiments/` directory in this repo, so the `experiments/pipeline_demo.py` command is not available.
