"""First-party operator sessions. The cookie is the session, not a script-readable token."""

from __future__ import annotations

import hashlib
import secrets
import time
import uuid
from dataclasses import dataclass
from typing import Callable, Protocol

from .owner_auth import Owner
from .store import StoreError


COOKIE_NAME = "swade_ontology_session"
_IDLE_DEFAULT = 30 * 24 * 60 * 60
_ABSOLUTE_DEFAULT = 90 * 24 * 60 * 60
_REAUTH_DEFAULT = 15 * 60


@dataclass
class HumanSession:
    session_id: str
    secret_hash: str
    owner_email: str
    owner_subject: str
    created_at: float
    last_seen_at: float
    authenticated_at: float
    revoked: bool = False


class SessionBackend(Protocol):
    def save_session(self, session: HumanSession) -> None:
        """Persist a session. The raw cookie secret is not included."""

    def revoke_session(self, session_id: str) -> None:
        """Revoke one device session."""

    def revoke_owner_sessions(self, owner_subject: str) -> None:
        """Revoke every session for this Google subject."""


class SessionRegistry:
    def __init__(
        self,
        idle_seconds: int = _IDLE_DEFAULT,
        absolute_seconds: int = _ABSOLUTE_DEFAULT,
        reauth_seconds: int = _REAUTH_DEFAULT,
        clock: Callable[[], float] | None = None,
        backend: SessionBackend | None = None,
        require_backend: bool = False,
    ) -> None:
        if idle_seconds <= 0 or absolute_seconds <= 0 or reauth_seconds <= 0:
            raise ValueError("session lifetimes must be positive")
        if idle_seconds > absolute_seconds:
            raise ValueError("idle lifetime cannot exceed the absolute lifetime")
        if reauth_seconds > idle_seconds:
            raise ValueError("reauth window cannot exceed the idle lifetime")
        self.idle_seconds = idle_seconds
        self.absolute_seconds = absolute_seconds
        self.reauth_seconds = reauth_seconds
        self.clock = clock or time.time
        self.backend = backend
        self.require_backend = require_backend
        self._sessions: dict[str, HumanSession] = {}

    def restore(self, session: HumanSession) -> None:
        self._sessions[session.session_id] = session

    def start(self, owner: Owner) -> tuple[HumanSession, str]:
        self._require_store()
        secret = secrets.token_urlsafe(32)
        now = self.clock()
        session = HumanSession(
            session_id=uuid.uuid4().hex,
            secret_hash=_hash_secret(secret),
            owner_email=owner.email,
            owner_subject=owner.subject,
            created_at=now,
            last_seen_at=now,
            authenticated_at=now,
        )
        self._sessions[session.session_id] = session
        self._persist(session)
        return session, f"{session.session_id}.{secret}"

    def reauthenticate(self, session: HumanSession, owner: Owner) -> None:
        if session.owner_subject != owner.subject or session.revoked:
            raise PermissionError("owner_mismatch")
        now = self.clock()
        session.authenticated_at = now
        session.last_seen_at = now
        self._persist(session)

    def resolve(self, cookie_value: str | None) -> tuple[str, HumanSession | None]:
        if not cookie_value or "." not in cookie_value:
            return "unauthenticated", None
        session_id, secret = cookie_value.split(".", 1)
        session = self._sessions.get(session_id)
        if session is None or not secrets.compare_digest(session.secret_hash, _hash_secret(secret)):
            return "unauthenticated", None
        if session.revoked:
            return "session_revoked", None
        now = self.clock()
        if now - session.created_at >= self.absolute_seconds or now - session.last_seen_at >= self.idle_seconds:
            session.revoked = True
            self._persist(session)
            return "session_expired", None
        session.last_seen_at = now
        self._persist(session)
        return "allow", session

    def needs_reauth(self, session: HumanSession) -> bool:
        return self.clock() - session.authenticated_at > self.reauth_seconds

    def revoke(self, session_id: str) -> None:
        session = self._sessions.get(session_id)
        if session is None:
            return
        session.revoked = True
        self._persist(session)
        if self.backend is not None:
            self.backend.revoke_session(session_id)

    def revoke_all(self, owner_subject: str) -> None:
        for session in self._sessions.values():
            if session.owner_subject == owner_subject:
                session.revoked = True
                self._persist(session)
        if self.backend is not None:
            self.backend.revoke_owner_sessions(owner_subject)

    def cookie_max_age(self, session: HumanSession) -> int:
        now = self.clock()
        remaining_absolute = int(self.absolute_seconds - (now - session.created_at))
        return max(0, min(self.idle_seconds, remaining_absolute))

    def _require_store(self) -> None:
        if self.require_backend and self.backend is None:
            raise StoreError("unavailable")

    def _persist(self, session: HumanSession) -> None:
        if self.backend is not None:
            self.backend.save_session(session)


def session_cookie(value: str, max_age: int) -> str:
    return (
        f"{COOKIE_NAME}={value}; HttpOnly; Secure; SameSite=Lax; Path=/v1/admin; Max-Age={max_age}"
    )


def clear_session_cookie() -> str:
    return f"{COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/v1/admin; Max-Age=0"


def read_session_cookie(cookie_header: str | None) -> str | None:
    if not cookie_header:
        return None
    for part in cookie_header.split(";"):
        name, separator, value = part.strip().partition("=")
        if separator and name == COOKIE_NAME:
            return value
    return None


def _hash_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()
