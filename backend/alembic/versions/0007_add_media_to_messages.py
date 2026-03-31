"""add media_url and file_size to messages

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-31
"""
import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("media_url", sa.String(500), nullable=True))
    op.add_column("messages", sa.Column("file_size", sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "media_url")
    op.drop_column("messages", "file_size")
