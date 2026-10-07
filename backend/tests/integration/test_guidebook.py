"""Unit guidebooks: content served from the database, with integrity rules of their own."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.enums import GuidebookEntryKind, GuidebookSectionKind
from app.models import Guidebook, GuidebookEntry, GuidebookSection, Unit
from tests.helpers import Api


def first_unit_id(api: Api) -> int:
    unit_id: int = api.get("/api/courses/1/path")["units"][0]["id"]
    return unit_id


def test_every_unit_has_a_guidebook_with_key_phrases_and_a_tip(api: Api) -> None:
    for unit in api.get("/api/courses/1/path")["units"]:
        guidebook = api.get(f"/api/units/{unit['id']}/guidebook")
        assert guidebook["unit_id"] == unit["id"]
        assert guidebook["unit_position"] == unit["position"]
        assert guidebook["language"] == "es"
        assert guidebook["introduction"]
        kinds = [section["kind"] for section in guidebook["sections"]]
        assert kinds[0] == "key_phrases"
        assert "tip" in kinds
        for section in guidebook["sections"]:
            assert section["title"]
            assert section["entries"]
            for entry in section["entries"]:
                assert entry["text"] and entry["translation"]


def test_sections_and_entries_come_back_in_authored_order(api: Api, db: Session) -> None:
    unit_id = first_unit_id(api)
    guidebook = api.get(f"/api/units/{unit_id}/guidebook")

    stored = db.scalars(
        select(GuidebookSection)
        .join(Guidebook)
        .where(Guidebook.unit_id == unit_id)
        .order_by(GuidebookSection.position)
    ).all()
    assert [section["title"] for section in guidebook["sections"]] == [s.title for s in stored]
    assert [e["text"] for e in guidebook["sections"][0]["entries"]] == [
        entry.text for entry in sorted(stored[0].entries, key=lambda entry: entry.position)
    ]


def test_tip_sections_explain_and_have_terms_and_examples(api: Api) -> None:
    guidebook = api.get(f"/api/units/{first_unit_id(api)}/guidebook")
    tip = next(section for section in guidebook["sections"] if section["kind"] == "tip")
    assert tip["body"]
    assert {entry["kind"] for entry in tip["entries"]} == {"term", "example"}


def test_unknown_unit_and_missing_guidebook_are_distinct_404s(
    client: TestClient, api: Api, db: Session
) -> None:
    missing_unit = client.get("/api/units/9999/guidebook")
    assert missing_unit.status_code == 404
    assert missing_unit.json()["error"]["code"] == "UNIT_NOT_FOUND"

    unit_id = first_unit_id(api)
    unit = db.get(Unit, unit_id)
    assert unit is not None
    unit.guidebook = None
    db.commit()
    no_guidebook = client.get(f"/api/units/{unit_id}/guidebook")
    assert no_guidebook.status_code == 404
    assert no_guidebook.json()["error"]["code"] == "GUIDEBOOK_NOT_FOUND"


def test_a_unit_can_have_only_one_guidebook(api: Api, db: Session) -> None:
    db.add(Guidebook(unit_id=first_unit_id(api), introduction="A second guidebook"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_positions_are_unique_within_a_section(api: Api, db: Session) -> None:
    section = db.scalars(select(GuidebookSection)).first()
    assert section is not None
    db.add(
        GuidebookEntry(
            section_id=section.id,
            position=1,
            kind=GuidebookEntryKind.PHRASE,
            text="hola",
            translation="hello",
        )
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_section_kind_is_constrained(api: Api, db: Session) -> None:
    guidebook = db.scalars(select(Guidebook)).first()
    assert guidebook is not None
    with pytest.raises(IntegrityError):
        db.execute(
            GuidebookSection.__table__.insert().values(  # type: ignore[attr-defined]
                guidebook_id=guidebook.id, position=99, kind="recipe", title="Nope"
            )
        )
        db.commit()
    db.rollback()


def test_deleting_a_guidebook_cascades_to_its_sections_and_entries(api: Api, db: Session) -> None:
    before = db.scalar(select(func.count()).select_from(GuidebookEntry))
    assert before
    for guidebook in db.scalars(select(Guidebook)).all():
        db.delete(guidebook)
    db.commit()

    assert db.scalar(select(func.count()).select_from(GuidebookSection)) == 0
    assert db.scalar(select(func.count()).select_from(GuidebookEntry)) == 0
    # The enum values the content uses are the ones the API documents.
    assert {kind.value for kind in GuidebookSectionKind} == {"key_phrases", "vocabulary", "tip"}
