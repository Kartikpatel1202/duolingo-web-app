"""One-time gem rewards: unit treasure chests (and the claim mechanics daily quests share).

A claim is one `reward_claims` row; UNIQUE(user_id, reward_key) guarantees a reward is paid at
most once even if the request is repeated or raced.
"""

from typing import Literal

from sqlalchemy.exc import IntegrityError

from app.domain.enums import SkillStatus
from app.domain.errors import RewardAlreadyClaimed, RewardNotAvailable, UnitNotFound
from app.domain.rewards import unit_chest_key
from app.domain.rules import UNIT_CHEST_GEMS
from app.models import Unit, User
from app.repositories import RewardRepository
from app.schemas.course import UnitChestOut
from app.schemas.engagement import ClaimOut
from app.services.context import ServiceContext
from app.services.course_progress import CourseProgress, CourseProgressService


def unit_chest(unit: Unit, progress: CourseProgress, claimed_keys: set[str]) -> UnitChestOut:
    """Chest state, derived: claimed (fact) / available (every skill completed) / locked."""
    status: Literal["locked", "available", "claimed"]
    if unit_chest_key(unit.id) in claimed_keys:
        status = "claimed"
    elif unit.skills and all(
        progress.skill_status(skill.id) is SkillStatus.COMPLETED for skill in unit.skills
    ):
        status = "available"
    else:
        status = "locked"
    return UnitChestOut(status=status, reward_gems=UNIT_CHEST_GEMS)


class RewardService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._rewards = RewardRepository(ctx.session)
        self._course_progress = CourseProgressService(ctx)

    def grant(self, user: User, reward_key: str, gems: int) -> ClaimOut:
        """Record the claim and pay out, in one transaction. Raises if already claimed."""
        if reward_key in self._rewards.claimed_keys(user.id, reward_key):
            raise RewardAlreadyClaimed(reward_key=reward_key)
        self._rewards.add_claim(user.id, reward_key, gems, self._ctx.now())
        user.gems += gems
        try:
            self._ctx.session.commit()
        except IntegrityError:  # a concurrent duplicate claim won
            self._ctx.session.rollback()
            raise RewardAlreadyClaimed(reward_key=reward_key) from None
        return ClaimOut(gems_awarded=gems, gems=user.gems)

    def claim_unit_chest(self, user: User, unit_id: int) -> ClaimOut:
        unit = self._ctx.session.get(Unit, unit_id)
        if unit is None:
            raise UnitNotFound(unit_id=unit_id)
        progress = self._course_progress.load(user.id, unit.course_id)
        chest = unit_chest(unit, progress, self._rewards.claimed_keys(user.id, "chest:"))
        if chest.status == "claimed":
            raise RewardAlreadyClaimed(reward_key=unit_chest_key(unit_id))
        if chest.status == "locked":
            raise RewardNotAvailable("Complete every skill in this unit to open its chest.")
        return self.grant(user, unit_chest_key(unit_id), chest.reward_gems)
