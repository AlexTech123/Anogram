"""make email nullable, remove unique constraint

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-31
"""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "email", nullable=True)
    # Drop unique index on email if it exists (ignore if not)
    try:
        op.drop_index("ix_users_email", table_name="users")
    except Exception:
        pass
    try:
        op.drop_constraint("users_email_key", "users", type_="unique")
    except Exception:
        pass


def downgrade() -> None:
    op.alter_column("users", "email", nullable=False)
