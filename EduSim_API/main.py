import sys
import os
# Configure Python Path to allow loading absolute namespaces (rag, tutor, sandbox)
root_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(root_dir)

# CORS origins — set ALLOWED_ORIGINS as a comma-separated string in the environment.
# Example: ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
# Defaults to localhost:5173 for local development.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]
sys.path.append(os.path.join(root_dir, "app", "src", "modules"))
sys.path.append(os.path.join(root_dir, "app", "src"))

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.src.modules.legacy_rag import load_all_pdfs
from app.src.api.simulation_router import simulation_router
from app.src.api.rag_router import rag_router
from app.src.api.tutor_router import tutor_router
from app.src.api.generate_router import generate_router
from app.src.api.persistence_router import persistence_router
from app.src.modules.sandbox.controller import sandbox_router
from app.src.api.scene_router import scene_router
from app.src.api.auth import auth_router
from app.src.api.curriculum_router import router as curriculum_router

from app.src.api.formula import router as generic_formula_router
from app.src.api.questions import router as generic_questions_router
from app.src.config.database import ping_database

# Configure global logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("EduSim")
logger.info("EduSim Backend Starting Up...")
logger.info("Formula Registry Loaded")
logger.info("Vector Store Loaded")
logger.info("Chapter Index Loaded")
logger.info("Formula APIs Ready")
logger.info("Question APIs Ready")
logger.info("RAG Ready")
logger.info("Server Ready")

from contextlib import asynccontextmanager
from app.src.modules.legacy_rag import vector_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload FAISS globally
    vector_store.load_all()
    
    # Automatically create tables for SQLite/PostgreSQL
    try:
        from app.src.config.database import Base, engine
        from app.src.models.user import User  # Registers User model with Base metadata
        from app.src.models.persistence import (  # Registers persistence models with Base metadata
            CurriculumClass,
            Subject,
            Chapter,
            Topic,
            ChatHistory,
            FormulaHistory,
            SimulationHistory,
            UserSetting,
            UserSession,
        )
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Populate curriculum database from curriculum.json if empty
        from app.src.config.database import SessionLocal
        from app.src.utils.curriculum_loader import populate_curriculum
        db = SessionLocal()
        try:
            populate_curriculum(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        
    yield

app = FastAPI(
    title="EduSim Physics API",
    description="Backend APIs for EduSim simulations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — origins are restricted to the ALLOWED_ORIGINS env var (see top of file).
# allow_credentials=True is safe here because origins are never wildcarded.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Route
@app.get("/")
async def root():
    logger.info("Health check endpoint pinged.")
    return {
        "success": True,
        "message": "EduSim FastAPI Backend Running"
    }


@app.get("/api/db/health")
async def database_health():
    return ping_database()

# Simulation Routes

app.include_router(
    auth_router,
    prefix="/api/auth"
)

app.include_router(
    generate_router,
    prefix="/api"
)

app.include_router(
    sandbox_router,
    prefix="/api"
)

app.include_router(
    scene_router,
    prefix="/api"
)

app.include_router(
    simulation_router,
    prefix="/api/simulations"
)

app.include_router(
    rag_router,
    prefix="/api/rag"
)

app.include_router(
    tutor_router,
    prefix="/api/tutor"
)


# --- Generic APIs for Formula Lab and Q&A ---
app.include_router(generic_formula_router, prefix="/api/formula")
app.include_router(generic_questions_router, prefix="/api/questions")
app.include_router(persistence_router, prefix="/api/persistence")
app.include_router(curriculum_router, prefix="/api")
