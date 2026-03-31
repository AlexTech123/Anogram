"""add last_read_message_id to chat_members

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-31
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chat_members",
        sa.Column("last_read_message_id", sa.BigInteger(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("chat_members", "last_read_message_id")
