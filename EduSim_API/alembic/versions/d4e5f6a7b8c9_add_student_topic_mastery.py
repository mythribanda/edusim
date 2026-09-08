"""add student_topic_mastery table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-07 11:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    if "student_topic_mastery" not in existing_tables:
        op.create_table(
            'student_topic_mastery',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('student_id', sa.UUID(), nullable=False),
            sa.Column('topic_id', sa.String(length=255), nullable=False),
            sa.Column('mastery_score', sa.Float(), server_default='0.0', nullable=False),
            sa.Column('correct_streak', sa.Integer(), server_default='0', nullable=False),
            sa.Column('total_attempts', sa.Integer(), server_default='0', nullable=False),
            sa.Column('total_correct', sa.Integer(), server_default='0', nullable=False),
            sa.Column('last_attempted_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('student_id', 'topic_id', name='uq_student_topic_mastery')
        )
        op.create_index(op.f('ix_student_topic_mastery_student_id'), 'student_topic_mastery', ['student_id'], unique=False)
        op.create_index(op.f('ix_student_topic_mastery_topic_id'), 'student_topic_mastery', ['topic_id'], unique=False)
        op.create_index(op.f('ix_student_topic_mastery_mastery_score'), 'student_topic_mastery', ['mastery_score'], unique=False)
        op.create_index('ix_mastery_student_score', 'student_topic_mastery', ['student_id', 'mastery_score'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    if "student_topic_mastery" in existing_tables:
        op.drop_table('student_topic_mastery')
