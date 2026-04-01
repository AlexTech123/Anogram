"""profile, reactions, pinned messages, message edit

Revision ID: 0009
Revises: 0008
Create Date: 2026-04-01
"""
import sqlalchemy as sa
from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # User profile fields
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)"))
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)"))
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(300)"))

    # Message edit
    conn.execute(sa.text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ"))

    # Pinned message per chat
    conn.execute(sa.text("ALTER TABLE chats ADD COLUMN IF NOT EXISTS pinned_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL"))

    # Reactions table
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS reactions (
            id SERIAL PRIMARY KEY,
            message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            emoji VARCHAR(20) NOT NULL,
            UNIQUE (message_id, user_id, emoji)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id)"))


def downgrade() -> None:
    op.drop_table("reactions")
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE chats DROP COLUMN IF EXISTS pinned_message_id"))
    conn.execute(sa.text("ALTER TABLE messages DROP COLUMN IF EXISTS edited_at"))
    conn.execute(sa.text("ALTER TABLE users DROP COLUMN IF EXISTS bio"))
    conn.execute(sa.text("ALTER TABLE users DROP COLUMN IF EXISTS avatar_url"))
    conn.execute(sa.text("ALTER TABLE users DROP COLUMN IF EXISTS display_name"))
