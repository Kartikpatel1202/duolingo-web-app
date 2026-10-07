"""Daily quests: progress is derived from today's facts; only claims are stored."""

from datetime import timedelta

from app.core.clock import local_midnight_utc
from app.domain import quests as quest_rules
from app.domain.errors import QuestNotFound, RewardAlreadyClaimed, RewardNotAvailable
from app.domain.leaderboard import next_week_start
from app.domain.quests import QuestMetric
from app.domain.rewards import quest_reward_key
from app.models import User
from app.repositories import AttemptRepository, RewardRepository, XpRepository
from app.schemas.engagement import ClaimOut, QuestOut, QuestsOut
from app.services.context import ServiceContext
from app.services.reward_service import RewardService


class QuestService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._attempts = AttemptRepository(ctx.session)
        self._xp = XpRepository(ctx.session)
        self._rewards = RewardRepository(ctx.session)

    def metrics(self, user: User) -> dict[QuestMetric, int]:
        today = self._ctx.today()
        start = local_midnight_utc(today, self._ctx.timezone)
        end = local_midnight_utc(today + timedelta(days=1), self._ctx.timezone)
        completions = self._attempts.completions_between(user.id, start, end)
        return {
            QuestMetric.LESSONS_TODAY: len(completions),
            QuestMetric.XP_TODAY: self._xp.xp_on(user.id, today),
            QuestMetric.PERFECT_LESSONS_TODAY: sum(1 for _, perfect in completions if perfect),
        }

    def daily(self, user: User) -> QuestsOut:
        today = self._ctx.today()
        metrics = self.metrics(user)
        claimed = self._rewards.claimed_keys(user.id, "quest:")
        return QuestsOut(
            day=today,
            resets_at=local_midnight_utc(today + timedelta(days=1), self._ctx.timezone),
            next_week_at=local_midnight_utc(next_week_start(today), self._ctx.timezone),
            quests=[
                QuestOut(
                    code=quest.code,
                    title=quest.title,
                    progress=quest_rules.progress(quest, metrics),
                    target=quest.target,
                    reward_gems=quest.reward_gems,
                    completed=quest_rules.is_complete(quest, metrics),
                    claimed=quest_reward_key(quest.code, today) in claimed,
                )
                for quest in quest_rules.DAILY_QUESTS
            ],
        )

    def claim(self, user: User, code: str) -> ClaimOut:
        quest = quest_rules.quest_by_code(code)
        if quest is None:
            raise QuestNotFound(quest=code)
        key = quest_reward_key(code, self._ctx.today())
        if key in self._rewards.claimed_keys(user.id, key):
            raise RewardAlreadyClaimed(reward_key=key)
        if not quest_rules.is_complete(quest, self.metrics(user)):
            raise RewardNotAvailable("Finish the quest first to open its chest.", quest=code)
        return RewardService(self._ctx).grant(user, key, quest.reward_gems)
