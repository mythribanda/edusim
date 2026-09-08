from pydantic import BaseModel, Field
from typing import List, Optional, Union, Any


class QuestionGenerateRequest(BaseModel):
    topic: str = Field(..., description="Physics topic name, e.g. Newton's Laws")
    difficulty: str = Field(default="medium", description="Difficulty level: easy, medium, hard")
    class_level: Union[str, int] = Field(default="10", description="Class / Grade level, e.g. 10 or 'Class 10'")
    count: int = Field(default=3, ge=1, le=50, description="Number of questions to return")


class QuestionItem(BaseModel):
    id: Optional[str] = None
    question: str
    options: List[str]
    correct: str
    explanation: Optional[str] = ""
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    class_level: Optional[str] = None

    class Config:
        from_attributes = True


# Legacy / backward-compatible models
class QuestionModel(BaseModel):
    question: str
    answer: str
    type: str = "conceptual"
    options: Optional[List[str]] = None
    explanation: str = ""
    formula_used: str = ""
    related_concept: str = ""
    difficulty: str = "Medium"


class QuestionGenerationResponse(BaseModel):
    questions: List[Union[QuestionItem, QuestionModel, Any]]
