"""Unit guidebooks: read-only course content shown from the unit banner."""

from app.domain.errors import GuidebookNotFound, UnitNotFound
from app.repositories import ContentRepository
from app.schemas.course import GuidebookEntryOut, GuidebookOut, GuidebookSectionOut
from app.services.context import ServiceContext


class GuidebookService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._content = ContentRepository(ctx.session)

    def for_unit(self, unit_id: int) -> GuidebookOut:
        unit = self._content.get_unit_with_guidebook(unit_id)
        if unit is None:
            raise UnitNotFound(unit_id=unit_id)
        if unit.guidebook is None:
            raise GuidebookNotFound(unit_id=unit_id)
        return GuidebookOut(
            unit_id=unit.id,
            unit_position=unit.position,
            unit_title=unit.title,
            language=unit.course.learning_language,
            introduction=unit.guidebook.introduction,
            sections=[
                GuidebookSectionOut(
                    kind=section.kind,
                    title=section.title,
                    body=section.body,
                    term_heading=section.term_heading,
                    translation_heading=section.translation_heading,
                    highlights=[w for w in (section.highlights or "").split(",") if w],
                    footer=section.footer,
                    layout=section.layout or "default",
                    entries=[
                        GuidebookEntryOut(
                            kind=entry.kind, text=entry.text, translation=entry.translation
                        )
                        for entry in section.entries
                    ],
                )
                for section in unit.guidebook.sections
            ],
        )
