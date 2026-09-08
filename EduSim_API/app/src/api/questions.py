import logging
from typing import List, Dict, Any, Union
from fastapi import APIRouter, Depends, Body, status
from sqlalchemy.orm import Session

from app.src.config.database import get_db
from app.src.services.question_service import QuestionService
from app.src.models.question_models import (
    QuestionGenerateRequest,
    QuestionItem,
    QuestionGenerationResponse,
)

logger = logging.getLogger("EduSim.api.questions")

router = APIRouter(tags=["Questions"])


@router.post("/generate", response_model=List[QuestionItem])
@router.post("/generate/", response_model=List[QuestionItem], include_in_schema=False)
async def generate_questions_endpoint(
    req: QuestionGenerateRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Cached Physics Question Generator:
    1. Checks the questions table in DB:
       SELECT questions WHERE topic=? AND difficulty=? AND class_level=? LIMIT count
    2. If enough cached questions exist, returns them (zero AI cost).
    3. If not enough, calls Ollama to generate the shortfall only.
    4. Validates and saves newly generated questions to the questions table for all future calls.
    """
    questions = await QuestionService.generate_cached_questions(
        topic=req.topic,
        difficulty=req.difficulty,
        class_level=req.class_level,
        count=req.count,
        db=db,
    )
    return questions
