"""Append-only audit log. Events are immutable and are never updated or deleted."""

from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime, timezone

from .policy import Caller, Decision

_TASK_ID: ContextVar[str | None] = ContextVar("swade_ontology_task_id", default=None)


@dataclass(frozen=True)
class AuditEvent:
    decision_id: str
    at: str
    app_id: str | None
    tenant_id: str | None
    tenant_class: str | None
    credential_id: str | None
    caller_id: str | None
    task_id: str | None
    terms: tuple[str, ...]
    source_tables: tuple[str, ...]
    action: str
    outcome: str


class AuditLog:
    def __init__(self) -> None:
        self._events: list[AuditEvent] = []

    def record(
        self,
        decision: Decision,
        action: str,
        caller: Caller | None = None,
        *,
        terms: tuple[str, ...] = (),
        source_tables: tuple[str, ...] = (),
        credential_id: str | None = None,
        task_id: str | None = None,
    ) -> AuditEvent:
        subject = caller or decision.caller
        event = AuditEvent(
            decision_id=decision.decision_id,
            at=datetime.now(timezone.utc).isoformat(),
            app_id=subject.app_id if subject else None,
            tenant_id=subject.tenant_id if subject else None,
            tenant_class=subject.tenant_class if subject else None,
            credential_id=credential_id or (getattr(subject, "credential_id", None) if subject else None),
            caller_id=subject.caller_id if subject else None,
            task_id=task_id if task_id is not None else _TASK_ID.get(),
            terms=tuple(terms),
            source_tables=tuple(source_tables),
            action=action,
            outcome=decision.code,
        )
        self._events.append(event)
        return event

    def events(self) -> tuple[AuditEvent, ...]:
        return tuple(self._events)

    def for_caller(self, caller: Caller) -> list[AuditEvent]:
        return [
            event
            for event in self._events
            if event.app_id == caller.app_id
            and event.tenant_id == caller.tenant_id
            and event.caller_id == caller.caller_id
        ]


def set_task_id(task_id: str | None) -> object:
    return _TASK_ID.set(task_id)


def reset_task_id(token: object) -> None:
    _TASK_ID.reset(token)  # type: ignore[arg-type]


def clean_task_id(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = "".join(character for character in value.strip() if character.isalnum() or character in "._:-")
    return cleaned[:128] or None
