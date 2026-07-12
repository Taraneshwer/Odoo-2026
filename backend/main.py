import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from backend.core.database import engine, Base
from backend.api.routes import api_router

# Import all models so SQLAlchemy creates them
import backend.models  # noqa: F401

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TransitOps API",
    description="""
    Backend API for TransitOps Fleet Management System.

    ## Modules
    - **Authentication & RBAC** — JWT login, role enforcement, account locking
    - **Vehicle Registry** — Full CRUD + operational cost aggregation
    - **Driver Management** — Driver directory with status transitions
    - **Trip Management** — Dispatch lifecycle with business rule enforcement
    - **Maintenance Logs** — Service tracking with vehicle status cascading
    - **Fuel & Expense Tracking** — Financial logging with auto-computation
    - **Analytics** — Dashboard KPIs, Fuel Efficiency, ROI, CSV exports
    """,
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|localhost|127\.0\.0\.1):(5173|3000|3001)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["Health"])
def read_root():
    return {"message": "TransitOps API v2.0 — Running", "docs": "/docs"}
