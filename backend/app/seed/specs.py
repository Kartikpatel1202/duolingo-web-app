"""Authoring format for course content.

Lessons are authored as vocabulary + example sentences; `builder.py` turns each lesson into a fixed
sequence of exercises covering every exercise type. Keeping authoring separate from exercise
JSON keeps the content readable and guarantees every lesson exercises every type.
"""

from dataclasses import dataclass, field

from app.domain.enums import GuidebookEntryKind, GuidebookSectionKind


@dataclass(frozen=True)
class Word:
    es: str
    en: str
    emoji: str | None = None


@dataclass(frozen=True)
class Sentence:
    es: str
    en: str
    blank: str  # the Spanish word removed in the fill-in-the-blank exercise
    es_alt: tuple[str, ...] = ()  # other correct Spanish translations
    en_alt: tuple[str, ...] = ()  # other correct English translations
    tip: str | None = None


@dataclass(frozen=True)
class LessonSpec:
    title: str
    words: tuple[Word, Word, Word, Word]
    sentences: tuple[Sentence, Sentence, Sentence]


@dataclass(frozen=True)
class SkillSpec:
    title: str
    icon: str
    description: str
    lessons: tuple[LessonSpec, ...]


@dataclass(frozen=True)
class GuidebookEntrySpec:
    kind: GuidebookEntryKind
    text: str
    translation: str


@dataclass(frozen=True)
class GuidebookSectionSpec:
    kind: GuidebookSectionKind
    title: str
    body: str | None = None
    entries: tuple[GuidebookEntrySpec, ...] = ()
    term_heading: str | None = None
    translation_heading: str | None = None
    highlights: tuple[str, ...] = ()
    footer: str | None = None
    layout: str = "default"


@dataclass(frozen=True)
class GuidebookSpec:
    introduction: str
    sections: tuple[GuidebookSectionSpec, ...]


@dataclass(frozen=True)
class UnitSpec:
    title: str
    description: str
    theme: str
    skills: tuple[SkillSpec, ...]
    guidebook: GuidebookSpec | None = None
    section: int = 1  # the part of the course this unit belongs to (shown as "Section N")


@dataclass(frozen=True)
class CourseSpec:
    slug: str
    title: str
    learning_language: str
    from_language: str
    description: str
    units: tuple[UnitSpec, ...] = field(default_factory=tuple)
