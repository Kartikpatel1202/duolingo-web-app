"""Unit guidebooks: Unit → Guidebook → Section → Entry.

A guidebook is course content (like lessons), so it lives under its unit and cascades with it.
Sections and entries are ordered by `position`, unique within their parent, exactly like the
rest of the content tree. Nothing here is learner-specific.
"""

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import str_enum
from app.domain.enums import GuidebookEntryKind, GuidebookSectionKind


class Guidebook(Base):
    __tablename__ = "guidebooks"

    id: Mapped[int] = mapped_column(primary_key=True)
    # One guidebook per unit: the unique FK makes the relationship 1 → 0..1.
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), unique=True)
    introduction: Mapped[str] = mapped_column(String(255))

    sections: Mapped[list["GuidebookSection"]] = relationship(
        back_populates="guidebook",
        order_by="GuidebookSection.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class GuidebookSection(Base):
    __tablename__ = "guidebook_sections"
    __table_args__ = (
        UniqueConstraint("guidebook_id", "position"),
        CheckConstraint("position >= 1", name="position_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    guidebook_id: Mapped[int] = mapped_column(ForeignKey("guidebooks.id", ondelete="CASCADE"))
    position: Mapped[int]
    kind: Mapped[GuidebookSectionKind] = mapped_column(
        str_enum(GuidebookSectionKind, "guidebook_section_kind")
    )
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str | None] = mapped_column(Text)
    # A tip's table: headings for its two columns (null: the language name and "English").
    term_heading: Mapped[str | None] = mapped_column(String(40))
    translation_heading: Mapped[str | None] = mapped_column(String(40))
    # Words to accent in the tip's text, comma-separated (null: the table's first-column words).
    highlights: Mapped[str | None] = mapped_column(String(120))
    # A tip's closing paragraph, shown after its table and before its examples.
    footer: Mapped[str | None] = mapped_column(Text)
    # Order of a tip's parts: null is "table, closing note, examples"; "examples_first" is
    # "examples, closing note, table"; "footer_last" is "table, examples, closing note".
    layout: Mapped[str | None] = mapped_column(String(20))

    guidebook: Mapped[Guidebook] = relationship(back_populates="sections")
    entries: Mapped[list["GuidebookEntry"]] = relationship(
        back_populates="section",
        order_by="GuidebookEntry.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class GuidebookEntry(Base):
    """One line of a section: a phrase, a term in a tip's table, or an example sentence."""

    __tablename__ = "guidebook_entries"
    __table_args__ = (
        UniqueConstraint("section_id", "position"),
        CheckConstraint("position >= 1", name="position_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("guidebook_sections.id", ondelete="CASCADE"))
    position: Mapped[int]
    kind: Mapped[GuidebookEntryKind] = mapped_column(
        str_enum(GuidebookEntryKind, "guidebook_entry_kind")
    )
    text: Mapped[str] = mapped_column(String(255))  # in the language being learned
    translation: Mapped[str] = mapped_column(String(255))

    section: Mapped[GuidebookSection] = relationship(back_populates="entries")
