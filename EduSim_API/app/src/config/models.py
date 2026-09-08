import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-2.5-flash"
FALLBACK_MODELS = [
    "google/gemini-2.5-flash-lite",
]

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "").strip()


def _split_model_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def get_primary_model() -> str:
    return OPENROUTER_MODEL or DEFAULT_MODEL


def get_fallback_model() -> str | None:
    fallback_env = os.getenv("OPENROUTER_FALLBACK_MODELS", "").strip()
    if fallback_env:
        models = _split_model_list(fallback_env)
        for m in models:
            if m and m != get_primary_model():
                return m
    for m in FALLBACK_MODELS:
        if m and m != get_primary_model():
            return m
    return None


def get_model_chain() -> list[str]:
    primary = get_primary_model()
    fallback = get_fallback_model()
    chain = [primary]
    if fallback and fallback != primary:
        chain.append(fallback)
    return chain

