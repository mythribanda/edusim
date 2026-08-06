import logging
logger = logging.getLogger("EduSim.config.database")

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_file = Path(__file__).resolve().parents[3] / "edusim.db"
    DATABASE_URL = f"sqlite:///{db_file}"
    logger.info(f"[Database] DATABASE_URL is not set. Falling back to local SQLite database: {db_file}")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _mask_database_url(url: str) -> str:
    from urllib.parse import urlsplit, urlunsplit
    try:
        parts = urlsplit(url)
        if parts.password or parts.username:
            netloc = parts.hostname or ""
            if parts.port:
                netloc += f":{parts.port}"
            return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
        return url
    except Exception:
        return "[unavailable]"


def ping_database() -> dict[str, object]:
    try:
        with engine.connect() as connection:
            if "sqlite" in DATABASE_URL:
                version = connection.execute(text("SELECT sqlite_version();")).scalar_one()
                db_type = "SQLite"
            else:
                version = connection.execute(text("SELECT version();")).scalar_one()
                db_type = "PostgreSQL"

        return {
            "success": True,
            "message": f"Connected to {db_type}",
            "database_url": _mask_database_url(DATABASE_URL),
            "version": version,
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Database connection failed: {str(e)}",
            "database_url": _mask_database_url(DATABASE_URL),
        }