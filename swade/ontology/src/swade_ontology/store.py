"""Read and write the isolated SWADE database. This module does not create tables."""

from __future__ import annotations

import threading
from typing import Protocol

from .brain import DocumentHit
from .fts import fts_statement
from .policy import Approval, Credential, Policy
from .scopes import encode_scopes, scopes_from_storage


class StoreError(RuntimeError):
    """The isolated database could not be used. Tables are not created here."""


class Queryable(Protocol):
    def query(self, sql: str, params: tuple[object, ...] = ()) -> list[tuple[object, ...]]:
        """Run one parameterized statement and return rows."""


LOAD_CREDENTIALS = """
SELECT credential_id, token_hash, app_id, tenant_id, tenant_class, caller_id, caller_kind, plan, status, scopes, access
FROM swade_ontology.credentials
""".strip()

LOAD_APPROVALS = """
SELECT approval_id, credential_id, action, owner_email, owner_subject
FROM swade_ontology.approvals
ORDER BY created_at
""".strip()

INSERT_CREDENTIAL = """
INSERT INTO swade_ontology.credentials (
  credential_id, token_hash, app_id, tenant_id, tenant_class, caller_id, caller_kind, plan, status, scopes, access
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""".strip()

RECORD_APPROVAL = """
WITH updated AS (
  UPDATE swade_ontology.credentials
  SET status = %s
  WHERE credential_id = %s
  RETURNING credential_id
)
INSERT INTO swade_ontology.approvals (
  approval_id, credential_id, action, owner_email, owner_subject
)
SELECT %s, credential_id, %s, %s, %s
FROM updated
""".strip()

SCHEMA_PRESENT = "SELECT to_regclass('swade_ontology.credentials')"

LOAD_SESSIONS = """
SELECT session_id, secret_hash, owner_email, owner_subject, created_at, last_seen_at, authenticated_at, revoked
FROM swade_ontology.admin_sessions
WHERE revoked = false
""".strip()

SAVE_SESSION = """
INSERT INTO swade_ontology.admin_sessions (
  session_id, secret_hash, owner_email, owner_subject, created_at, last_seen_at, authenticated_at, revoked
) VALUES (%s, %s, %s, %s, to_timestamp(%s), to_timestamp(%s), to_timestamp(%s), %s)
ON CONFLICT (session_id) DO UPDATE SET
  last_seen_at = EXCLUDED.last_seen_at,
  authenticated_at = EXCLUDED.authenticated_at,
  revoked = EXCLUDED.revoked
""".strip()

REVOKE_SESSION = """
UPDATE swade_ontology.admin_sessions SET revoked = true WHERE session_id = %s
""".strip()

REVOKE_OWNER_SESSIONS = """
UPDATE swade_ontology.admin_sessions SET revoked = true WHERE owner_subject = %s
""".strip()

INSERT_AUDIT = """
INSERT INTO swade_ontology.audit_events (
  decision_id, app_id, tenant_id, tenant_class, credential_id, caller_id, task_id, terms, source_tables, action, outcome
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""".strip()


class IsolatedStore:
    mode = "postgres"

    def __init__(self, database: Queryable) -> None:
        self.database = database

    def load_into(self, policy: Policy) -> None:
        if not self.ready():
            raise StoreError("not_migrated")
        for row in self.database.query(LOAD_CREDENTIALS):
            if len(row) != 11:
                continue
            app = policy.catalog.app(str(row[2]))
            parsed = scopes_from_storage(str(row[9]), app.terms) if app is not None else None
            if parsed is None or str(row[10]) != "read":
                continue
            policy.restore_credential(
                Credential(
                    credential_id=str(row[0]),
                    token_hash=str(row[1]),
                    app_id=str(row[2]),
                    tenant_id=str(row[3]),
                    tenant_class=str(row[4]),
                    caller_id=str(row[5]),
                    caller_kind=str(row[6]),
                    plan=str(row[7]),
                    status=str(row[8]),
                    scopes=parsed,
                    access="read",
                )
            )
        for row in self.database.query(LOAD_APPROVALS):
            if len(row) != 5 or row[2] not in {"approve", "revoke"}:
                continue
            policy.approvals.append(
                Approval(
                    approval_id=str(row[0]),
                    credential_id=str(row[1]),
                    action=str(row[2]),
                    owner_email=str(row[3]).lower(),
                    owner_subject=str(row[4]),
                )
            )

    def ready(self) -> bool:
        rows = self.database.query(SCHEMA_PRESENT)
        return bool(rows and rows[0] and rows[0][0])

    def insert_credential(self, credential: Credential) -> None:
        self.database.query(
            INSERT_CREDENTIAL,
            (
                credential.credential_id,
                credential.token_hash,
                credential.app_id,
                credential.tenant_id,
                credential.tenant_class,
                credential.caller_id,
                credential.caller_kind,
                credential.plan,
                credential.status,
                encode_scopes(credential.scopes),
                credential.access,
            ),
        )

    def insert_approval(self, approval: Approval, status: str) -> None:
        self.database.query(
            RECORD_APPROVAL,
            (
                status,
                approval.credential_id,
                approval.approval_id,
                approval.action,
                approval.owner_email,
                approval.owner_subject,
            ),
        )

    def load_sessions(self) -> list[tuple[object, ...]]:
        return self.database.query(LOAD_SESSIONS)

    def save_session(self, session: object) -> None:
        self.database.query(
            SAVE_SESSION,
            (
                session.session_id,
                session.secret_hash,
                session.owner_email,
                session.owner_subject,
                session.created_at,
                session.last_seen_at,
                session.authenticated_at,
                session.revoked,
            ),
        )

    def revoke_session(self, session_id: str) -> None:
        self.database.query(REVOKE_SESSION, (session_id,))

    def revoke_owner_sessions(self, owner_subject: str) -> None:
        self.database.query(REVOKE_OWNER_SESSIONS, (owner_subject,))

    def insert_audit(self, event: object) -> None:
        if "UPDATE" in INSERT_AUDIT or "DELETE" in INSERT_AUDIT:
            raise StoreError("audit_not_append_only")
        self.database.query(
            INSERT_AUDIT,
            (
                event.decision_id,
                event.app_id,
                event.tenant_id,
                event.tenant_class,
                event.credential_id,
                event.caller_id,
                event.task_id,
                ",".join(event.terms),
                ",".join(event.source_tables),
                event.action,
                event.outcome,
            ),
        )

    def search_documents(self, tenant_id: str, query: str, limit: int) -> list[DocumentHit]:
        statement, params = fts_statement(tenant_id, query, limit)
        if query and query in statement:
            raise StoreError("interpolated_query")
        hits: list[DocumentHit] = []
        for row in self.database.query(statement, params):
            if len(row) < 4 or str(row[1]) != tenant_id:
                continue
            hits.append(
                DocumentHit(
                    id=str(row[0]),
                    tenant_id=tenant_id,
                    title=str(row[2]),
                    excerpt=str(row[3])[:240],
                    source="postgres-fts",
                )
            )
        return hits


class PostgresDocumentIndex:
    def __init__(self, store: IsolatedStore) -> None:
        self.store = store

    def search(self, tenant_id: str, query: str, limit: int) -> list[DocumentHit]:
        return self.store.search_documents(tenant_id, query, limit)


class PsycopgDatabase:
    def __init__(self, connection: object) -> None:
        self.connection = connection
        self._lock = threading.Lock()

    def query(self, sql: str, params: tuple[object, ...] = ()) -> list[tuple[object, ...]]:
        with self._lock:
            cursor = self.connection.cursor()
            try:
                cursor.execute(sql, params)
                rows = cursor.fetchall() if cursor.description else []
                self.connection.commit()
            except Exception:
                self.connection.rollback()
                raise
            finally:
                cursor.close()
        return list(rows)


def connect_store(database_url: str) -> IsolatedStore:
    try:
        import psycopg
    except ImportError as exc:
        raise StoreError("psycopg_missing") from exc
    try:
        connection = psycopg.connect(database_url, connect_timeout=5)
    except Exception as exc:
        raise StoreError("unavailable") from exc
    return IsolatedStore(PsycopgDatabase(connection))
