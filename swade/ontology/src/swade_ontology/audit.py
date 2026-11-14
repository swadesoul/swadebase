"""In-process audit log. The durable table is created only by an operator."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from .policy import Caller, Decision


@dataclass(frozen=True)
class AuditEvent:
    decision_id: str
    at: str
    app_id: str | None
    tenant_id: str | None
    tenant_class: str | None
    caller_id: str | None
    action: str
    outcome: str


class AuditLog:
    def __init__(self) -> None:
        self._events: list[AuditEvent] = []

    def record(self, decision: Decision, action: str, caller: Caller | None = None) -> AuditEvent:
        subject = caller or decision.caller
        event = AuditEvent(
            decision_id=decision.decision_id,
            at=datetime.now(timezone.utc).isoformat(),
            app_id=subject.app_id if subject else None,
            tenant_id=subject.tenant_id if subject else None,
            tenant_class=subject.tenant_class if subject else None,
            caller_id=subject.caller_id if subject else None,
            action=action,
            outcome=decision.code,
        )
        self._events.append(event)
        return event

    def for_caller(self, caller: Caller) -> list[AuditEvent]:
        return [
            event
            for event in self._events
            if event.app_id == caller.app_id and event.tenant_id == caller.tenant_id and event.caller_id == caller.caller_id
        ]
