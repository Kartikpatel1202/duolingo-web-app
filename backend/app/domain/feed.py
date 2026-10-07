"""Learning tips shown in the feed (original content), rotated deterministically by day."""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Tip:
    code: str
    label: str
    title: str
    body: str


TIPS: tuple[Tip, ...] = (
    Tip("ser-estar", "GRAMMAR", "Ser or estar?",
        "Use ser for what something is and estar for how it is now: soy alto · estoy cansado."),
    Tip("silent-h", "PRONUNCIATION", "The silent h",
        "In Spanish the h is never pronounced — hola sounds like “ola”."),
    Tip("lunch", "CULTURE", "Lunch is the big meal",
        "In Spain the main meal is often eaten around 2–3 pm. ¡Buen provecho!"),
    Tip("punctuation", "GRAMMAR", "Upside-down punctuation",
        "Questions and exclamations open with ¿ and ¡ — ¿Qué tal? ¡Hola!"),
    Tip("false-friends", "VOCABULARY", "Watch out for false friends",
        "Embarazada means pregnant, not embarrassed. Use “avergonzado” for embarrassed."),
    Tip("surnames", "CULTURE", "Two surnames",
        "Many Spanish speakers carry two surnames — one from each parent."),
)  # fmt: skip


def tips_for(day: date, count: int) -> list[Tip]:
    """`count` consecutive tips starting at an offset that changes daily (same all day)."""
    start = day.toordinal() % len(TIPS)
    return [TIPS[(start + i) % len(TIPS)] for i in range(min(count, len(TIPS)))]
