"""
middleware/rbac.py — Role-Based Access Control (RBAC) dependencies for EduSim.
"""

from typing import Callable, Optional, Sequence, Union
import uuid
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.src.config.database import get_db
from app.src.api.auth import get_current_user
from app.src.models.user import User

# Role Aliases & Mapping
# "educator" and "teacher" are treated as equivalent.
# "admin" and "superadmin" are treated as having administrative privileges.
ROLE_ALIASES = {
    "teacher": "educator",
    "educator": "educator",
    "admin": "admin",
    "superadmin": "admin",
    "student": "student",
    "parent": "parent",
}


def normalize_role(role: Union[str, any]) -> str:
    """Normalize a role string or Enum value to canonical lowercase representation."""
    if hasattr(role, "value"):
        role = role.value
    raw = str(role or "").strip().lower()
    return ROLE_ALIASES.get(raw, raw)


def require_role(*roles: str) -> Callable:
    """
    FastAPI dependency factory to enforce user role requirements.
    Usage:
        @router.get("/admin/users", dependencies=[Depends(require_role("admin"))])
        or
        def get_data(current_user: User = Depends(require_role("educator", "admin"))):
    """
    allowed_normalized = {normalize_role(r) for r in roles}

    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        user_role = normalize_role(getattr(current_user, "role", None))

        # Superadmin / admin always has access if admin is permitted, or if educator is permitted
        if user_role == "admin" and ("admin" in allowed_normalized or "educator" in allowed_normalized):
            return current_user

        if user_role not in allowed_normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(roles)} (Current role: {user_role})",
            )
        return current_user

    return role_dependency


# Convenience Presets
require_admin = require_role("admin")
require_educator = require_role("educator", "admin")
require_student = require_role("student", "admin")


def check_class_membership(user: User, class_id: Union[str, UUID, int], db: Session) -> bool:
    """
    Check if a user is enrolled in or teaches the specified class.
    Admins are always granted membership.
    """
    user_role = normalize_role(getattr(user, "role", None))
    if user_role == "admin":
        return True

    str_class_id = str(class_id)
    user_class_id = str(user.class_id) if getattr(user, "class_id", None) else None

    # Direct match on user.class_id
    if user_class_id and user_class_id == str_class_id:
        return True

    # Check StudentEnrollment table
    try:
        from models import StudentEnrollment
        enrollment = db.query(StudentEnrollment).filter(
            StudentEnrollment.student_id == user.id,
            StudentEnrollment.class_id == class_id,
            StudentEnrollment.status == "active",
        ).first()
        if enrollment:
            return True
    except Exception:
        pass

    # If educator teaches this class
    if user_role == "educator":
        try:
            from models import Class, TeacherClassSubject
            cls = db.query(Class).filter(Class.id == class_id, Class.created_by == user.id).first()
            if cls:
                return True
            tcs = db.query(TeacherClassSubject).filter(
                TeacherClassSubject.teacher_id == user.id,
                TeacherClassSubject.class_id == class_id,
            ).first()
            if tcs:
                return True
        except Exception:
            pass

        try:
            student_in_class = db.query(User).filter(
                User.class_id == class_id,
                User.educator_id == user.id,
            ).first()
            if student_in_class:
                return True
        except Exception:
            pass

    return False


def require_class_member(
    class_id: Optional[Union[str, UUID, int]] = None,
    param_name: str = "class_id",
) -> Callable:
    """
    FastAPI dependency that checks the requesting user is enrolled in or teaches that class.
    Can be used:
    1. As a dependency factory: Depends(require_class_member()) (extracts from path/query/body)
    2. With static class_id: Depends(require_class_member(class_id="..."))
    """
    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        target_class_id = class_id
        if target_class_id is None:
            target_class_id = request.path_params.get(param_name) or request.query_params.get(param_name)

        if not target_class_id:
            try:
                body = await request.json()
                if isinstance(body, dict):
                    target_class_id = body.get(param_name)
            except Exception:
                pass

        if not target_class_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing class identifier parameter '{param_name}' for membership verification.",
            )

        if not check_class_membership(current_user, target_class_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. You are not enrolled in or teaching class {target_class_id}.",
            )

        return current_user

    return dependency


def require_student_or_teacher(
    param_name: str = "student_id",
) -> Callable:
    """
    FastAPI dependency ensuring the requesting user matches the student_id parameter
    OR is their assigned teacher / educator (or admin / linked parent).
    """
    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        target_student_id = request.path_params.get(param_name) or request.query_params.get(param_name)
        if not target_student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing student identifier parameter '{param_name}'.",
            )

        user_role = normalize_role(getattr(current_user, "role", None))
        if user_role == "admin":
            return current_user

        try:
            target_uuid = UUID(str(target_student_id))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid student UUID format.",
            )

        # 1. Student themselves
        if str(current_user.id) == str(target_uuid):
            return current_user

        # 2. Check if current_user is their teacher / educator
        student = db.query(User).filter(User.id == target_uuid).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

        if user_role == "educator":
            # Matches educator_id directly
            if getattr(student, "educator_id", None) and str(student.educator_id) == str(current_user.id):
                return current_user
            # Matches class_id
            if (
                getattr(current_user, "class_id", None)
                and getattr(student, "class_id", None)
                and str(current_user.class_id) == str(student.class_id)
            ):
                return current_user

            # Matches active enrollment in any class created or taught by this educator
            try:
                from models import Class, StudentEnrollment, TeacherClassSubject
                created_class_ids = {
                    row[0] for row in db.query(Class.id).filter(Class.created_by == current_user.id).all()
                }
                taught_class_ids = {
                    row[0] for row in db.query(TeacherClassSubject.class_id).filter(TeacherClassSubject.teacher_id == current_user.id).all()
                }
                all_teacher_class_ids = created_class_ids | taught_class_ids
                if all_teacher_class_ids:
                    enrolled = db.query(StudentEnrollment).filter(
                        StudentEnrollment.student_id == target_uuid,
                        StudentEnrollment.class_id.in_(all_teacher_class_ids),
                        StudentEnrollment.status == "active",
                    ).first()
                    if enrolled:
                        return current_user
            except Exception:
                pass


        # 3. Check if parent linked (preserve parent link compatibility)
        if user_role == "parent":
            try:
                from app.src.models.persistence import ParentStudent
                link = db.query(ParentStudent).filter(
                    ParentStudent.parent_id == current_user.id,
                    ParentStudent.student_id == target_uuid,
                ).first()
                if link:
                    return current_user
            except Exception:
                pass

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are neither this student nor their authorized teacher.",
        )

    return dependency
