"""contact nicknames table

Revision ID: 0008
Revises: 0007
Create Date: 2026-04-01
"""
import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contact_nicknames",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contact_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nickname", sa.String(100), nullable=False),
        sa.UniqueConstraint("owner_id", "contact_user_id"),
    )
    op.create_index("idx_contact_nicknames_owner", "contact_nicknames", ["owner_id"])


def downgrade() -> None:
    op.drop_table("contact_nicknames")
