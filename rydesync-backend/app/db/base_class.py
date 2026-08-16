"""
app/db/base_class.py
─────────────────────
Single declarative base shared by all ORM models.
Provides automatic __tablename__ generation from the class name.
"""
from __future__ import annotations

import re
from typing import Any

from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """
    All ORM models inherit from this class.

    Auto-generates __tablename__ as the snake_case plural of the class name.
    E.g.  User → users,  RideComparison → ride_comparisons
    """

    @declared_attr.directive
    @classmethod
    def __tablename__(cls) -> str:
        # CamelCase → snake_case, then pluralise naively
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()
        return name + "s"

    def __repr__(self) -> str:  # pragma: no cover
        cols = ", ".join(
            f"{c.name}={getattr(self, c.name)!r}"
            for c in self.__table__.columns
        )
        return f"<{self.__class__.__name__}({cols})>"
