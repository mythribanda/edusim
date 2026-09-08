"""add session_events table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-07 12:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    if "session_events" not in existing_tables:
        op.create_table(
            'session_events',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('student_id', sa.UUID(), nullable=False),
            sa.Column('module_id', sa.UUID(), nullable=True),
            sa.Column('event_type', sa.Text(), nullable=False),
            sa.Column('payload', sa.JSON(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_session_events_student_id'), 'session_events', ['student_id'], unique=False)
        op.create_index(op.f('ix_session_events_event_type'), 'session_events', ['event_type'], unique=False)
        op.create_index(op.f('ix_session_events_created_at'), 'session_events', ['created_at'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    if "session_events" in existing_tables:
        op.drop_index(op.f('ix_session_events_created_at'), table_name='session_events')
        op.drop_index(op.f('ix_session_events_event_type'), table_name='session_events')
        op.drop_index(op.f('ix_session_events_student_id'), table_name='session_events')
        op.drop_table('session_events')
