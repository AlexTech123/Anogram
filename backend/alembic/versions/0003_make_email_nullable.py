"""make email nullable

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
    conn = op.get_bind()
    # Drop unique constraint with IF EXISTS — never fails, never aborts the transaction
    conn.execute(sa.text(
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key"
    ))
    conn.execute(sa.text(
        "DROP INDEX IF EXISTS ix_users_email"
    ))
    # Make nullable
    conn.execute(sa.text(
        "ALTER TABLE users ALTER COLUMN email DROP NOT NULL"
    ))


def downgrade() -> None:
    op.alter_column("users", "email", nullable=False)
