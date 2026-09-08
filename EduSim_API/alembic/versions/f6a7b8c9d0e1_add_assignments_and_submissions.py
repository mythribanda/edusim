"""add assignments and submissions tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-07 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    # -- assignments ----------------------------------------------------------
    if "assignments" not in existing_tables:
        op.create_table(
            "assignments",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "class_id",
                sa.UUID(as_uuid=True),
                sa.ForeignKey("classes.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column(
                "teacher_id",
                sa.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("description", sa.String, nullable=True),
            sa.Column("module_id", sa.String(255), nullable=True, index=True),
            sa.Column("due_date", sa.DateTime(timezone=True), nullable=True, index=True),
            sa.Column("max_score", sa.Float, nullable=False, server_default="100.0"),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
                index=True,
            ),
        )
        op.create_index("ix_assignment_class_due", "assignments", ["class_id", "due_date"])
        op.create_index("ix_assignment_teacher_created", "assignments", ["teacher_id", "created_at"])

    # -- submissions ----------------------------------------------------------
    if "submissions" not in existing_tables:
        status_check = sa.CheckConstraint(
            "status IN ('pending', 'submitted', 'graded')",
            name="chk_submission_status",
        )
        op.create_table(
            "submissions",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "assignment_id",
                sa.UUID(as_uuid=True),
                sa.ForeignKey("assignments.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column(
                "student_id",
                sa.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("score", sa.Float, nullable=True),
            sa.Column("feedback", sa.String, nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            status_check,
            sa.UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
        )
        op.create_index("ix_submission_student_status", "submissions", ["student_id", "status"])
        op.create_index("ix_submission_assignment_status", "submissions", ["assignment_id", "status"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()
    if "submissions" in existing_tables:
        op.drop_index("ix_submission_assignment_status", table_name="submissions")
        op.drop_index("ix_submission_student_status", table_name="submissions")
        op.drop_table("submissions")
    if "assignments" in existing_tables:
        op.drop_index("ix_assignment_teacher_created", table_name="assignments")
        op.drop_index("ix_assignment_class_due", table_name="assignments")
        op.drop_table("assignments")
