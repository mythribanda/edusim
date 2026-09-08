import os
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger("EduSim.config.settings")

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")


def validate_supabase_url(url: str | None = None) -> str:
    """
    Validates the SUPABASE_URL configuration setting.
    Throws a clear startup error if SUPABASE_URL is not set or still contains 'your-project'.
    """
    target_url = url if url is not None else os.getenv("SUPABASE_URL")
    if not target_url:
        raise RuntimeError(
            "Startup error: SUPABASE_URL is not set. "
            "Please configure a valid SUPABASE_URL in your environment."
        )
    if "your-project" in target_url:
        raise RuntimeError(
            f"Startup error: SUPABASE_URL is set to placeholder value '{target_url}'. "
            "Please configure a valid Supabase project URL."
        )
    return target_url


def validate_jwt_secret(secret: str | None = None) -> str:
    """
    Validates the JWT_SECRET (or JWT_SECRET_KEY) configuration setting.
    Throws a clear startup error if missing or < 32 characters.
    """
    target_secret = secret if secret is not None else (os.getenv("JWT_SECRET") or os.getenv("JWT_SECRET_KEY"))
    if not target_secret:
        raise RuntimeError(
            "Startup error: JWT_SECRET environment variable is missing. "
            "Please configure a valid JWT secret in your environment (minimum 32 characters)."
        )
    if len(target_secret.strip()) < 32:
        raise RuntimeError(
            f"Startup error: JWT_SECRET is too short ({len(target_secret.strip())} characters). "
            "JWT_SECRET must be at least 32 characters long for cryptographic security."
        )
    return target_secret.strip()


def validate_config():
    """Startup configuration validation."""
    validate_supabase_url()
    validate_jwt_secret()


class Settings:
    @property
    def SUPABASE_URL(self) -> str:
        return validate_supabase_url()


settings = Settings()
