from sqlalchemy import BigInteger, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (UniqueConstraint("message_id", "user_id", "emoji"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji: Mapped[str] = mapped_column(String(20), nullable=False)

    user = relationship("User")
