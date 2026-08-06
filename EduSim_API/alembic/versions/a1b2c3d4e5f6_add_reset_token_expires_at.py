"""add reset_token_expires_at to users

Revision ID: a1b2c3d4e5f6
Revises: fc62e10ff6d1
Create Date: 2026-08-06 23:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'fc62e10ff6d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'reset_token_expires_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'reset_token_expires_at')
