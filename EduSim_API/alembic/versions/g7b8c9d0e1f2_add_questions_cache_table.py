"""add questions cache table

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-09-07 21:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = "g7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    # -- questions ------------------------------------------------------------
    if "questions" not in existing_tables:
        op.create_table(
            "questions",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
            sa.Column("topic", sa.String(255), nullable=False, index=True),
            sa.Column("difficulty", sa.String(50), nullable=False, index=True),
            sa.Column("class_level", sa.String(50), nullable=False, index=True),
            sa.Column("question", sa.Text(), nullable=False),
            sa.Column("options", sa.JSON(), nullable=False),
            sa.Column("correct", sa.String(255), nullable=False),
            sa.Column("explanation", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_questions_lookup",
            "questions",
            ["topic", "difficulty", "class_level"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()
    if "questions" in existing_tables:
        op.drop_index("ix_questions_lookup", table_name="questions")
        op.drop_table("questions")
