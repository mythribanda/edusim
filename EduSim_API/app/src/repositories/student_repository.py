from sqlalchemy.orm import Session
from app.src.models.persistence import StudentProfile
import uuid
from typing import Union, Optional

class StudentRepository:
    @staticmethod
    def _to_uuid(val: Union[uuid.UUID, str, None]) -> Optional[uuid.UUID]:
        if val is None:
            return None
        if isinstance(val, uuid.UUID):
            return val
        try:
            return uuid.UUID(str(val))
        except (ValueError, TypeError, AttributeError):
            return None

    @staticmethod
    def get_or_create_profile(db: Session, user_id: uuid.UUID | str) -> StudentProfile:
        uid = StudentRepository._to_uuid(user_id)
        if not uid:
            raise ValueError(f"Invalid user_id for profile: {user_id}")
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == uid).first()
        if not profile:
            profile = StudentProfile(
                user_id=uid,
                skill_level="beginner",
                mastered_topics=[],
                misconceptions=[]
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        return profile

    @staticmethod
    def update_profile(
        db: Session,
        user_id: uuid.UUID | str,
        skill_level: str | None = None,
        mastered_topics: list | None = None,
        misconceptions: list | None = None
    ) -> StudentProfile:
        profile = StudentRepository.get_or_create_profile(db, user_id)
        if skill_level is not None:
            profile.skill_level = skill_level
        if mastered_topics is not None:
            profile.mastered_topics = mastered_topics
        if misconceptions is not None:
            profile.misconceptions = misconceptions
        db.commit()
        db.refresh(profile)
        return profile
