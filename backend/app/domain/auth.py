"""Authentication rules: password hashing and signed session tokens. Pure — no DB, HTTP or clock.

Passwords are stored as salted PBKDF2-SHA256 hashes in a self-describing string
(`pbkdf2_sha256$<iterations>$<salt>$<hash>`), so the work factor can be raised later without
breaking existing accounts.

A session token is `<user id>.<expiry, unix seconds>.<signature>`, signed with HMAC-SHA256 and the
server's secret. The server can verify it without storing anything, so sessions survive restarts
and a learner is identified by one cheap check per request. The trade-off (documented in
docs/architecture.md): a token cannot be revoked before it expires.
"""

import base64
import hashlib
import hmac
from datetime import datetime

_ALGORITHM = "pbkdf2_sha256"


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str, salt: bytes, iterations: int) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{_ALGORITHM}${iterations}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str | None) -> bool:
    """True when `password` matches the stored hash. Malformed or missing hashes never match."""
    if not stored:
        return False
    try:
        algorithm, iterations, salt, expected = stored.split("$")
        if algorithm != _ALGORITHM:
            return False
        candidate = hash_password(password, _unb64(salt), int(iterations))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate, stored) and bool(expected)


def _signature(payload: str, secret: str) -> str:
    return _b64(hmac.new(secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest())


def issue_token(user_id: int, expires_at: datetime, secret: str) -> str:
    payload = f"{user_id}.{int(expires_at.timestamp())}"
    return f"{payload}.{_signature(payload, secret)}"


def read_token(token: str, now: datetime, secret: str) -> int | None:
    """The user id a token was issued for, or None if it is malformed, forged or expired."""
    try:
        user_id, expires, signature = token.split(".")
        payload = f"{user_id}.{expires}"
        if not hmac.compare_digest(signature, _signature(payload, secret)):
            return None
        if int(expires) <= int(now.timestamp()):
            return None
        return int(user_id)
    except (ValueError, UnicodeEncodeError):
        return None


def username_from_email(email: str, taken: set[str]) -> str:
    """A unique username from the part of the email before the @ (letters, digits, _ only)."""
    base = "".join(ch for ch in email.split("@")[0].lower() if ch.isalnum() or ch == "_")[:24]
    base = base or "learner"
    if base not in taken:
        return base
    return next(f"{base}{n}" for n in range(2, len(taken) + 3) if f"{base}{n}" not in taken)


def display_name_from_email(email: str) -> str:
    """A friendly default name: "sam.lee@example.com" becomes "Sam"."""
    first = email.split("@")[0].replace("_", ".").replace("-", ".").split(".")[0]
    letters = "".join(ch for ch in first if ch.isalpha())
    return letters.capitalize() or "Learner"
