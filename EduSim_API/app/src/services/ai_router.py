# Re-export call_ai from services.ai_router
from services.ai_router import (
    call_ai,
    OLLAMA_BASE_URL,
    OLLAMA_GENERATE_URL,
    OLLAMA_DEFAULT_MODEL,
)

__all__ = ["call_ai", "OLLAMA_BASE_URL", "OLLAMA_GENERATE_URL", "OLLAMA_DEFAULT_MODEL"]
