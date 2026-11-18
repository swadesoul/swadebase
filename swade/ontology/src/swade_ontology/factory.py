"""Wire the facade. The process does not migrate a database on startup."""

from __future__ import annotations

import os

from .audit import AuditLog
from .brain import BrainClient
from .catalog import load_catalog
from .config import Config, load_config
from .engine import EngineClient
from .fts import MemoryDocumentIndex
from .gateway import Gateway
from .http_server import serve
from .owner_auth import OwnerAuth
from .policy import Policy
from .service import KnowledgeService
from .sessions import HumanSession, SessionRegistry
from .store import PostgresDocumentIndex, StoreError, connect_store


def build_service(config: Config | None = None) -> KnowledgeService:
    resolved = config or load_config()
    catalog = load_catalog()
    policy = Policy(catalog)
    documents = MemoryDocumentIndex()
    store = None
    if resolved.database_url:
        try:
            store = connect_store(resolved.database_url)
            store.load_into(policy)
            documents = PostgresDocumentIndex(store)
        except StoreError:
            store = _UnavailableStore()
            documents = PostgresDocumentIndex(store)
    sessions = SessionRegistry(
        idle_seconds=resolved.session_idle_seconds,
        absolute_seconds=resolved.session_absolute_seconds,
        reauth_seconds=resolved.session_reauth_seconds,
        require_backend=bool(resolved.database_url),
    )
    if store is not None and hasattr(store, "load_sessions"):
        try:
            for row in store.load_sessions():
                sessions.restore(_human_session(row))
            sessions.backend = store
            sessions.require_backend = False
        except StoreError:
            sessions.backend = None
            sessions.require_backend = True
    return KnowledgeService(
        config=resolved,
        catalog=catalog,
        policy=policy,
        audit=AuditLog(),
        gateway=Gateway(
            resolved.gateway_url,
            resolved.gateway_key,
            local_model=resolved.local_model,
            paid_model=resolved.paid_model,
        ),
        brain=BrainClient(resolved.brain_search_url, resolved.brain_token),
        documents=documents,
        engine=EngineClient(resolved.engine_url, resolved.pin),
        owner=OwnerAuth(resolved.auth_url, resolved.owner_email),
        store=store,
        sessions=sessions,
    )


class _UnavailableStore:
    mode = "unavailable"

    def insert_credential(self, credential: object) -> None:
        raise StoreError("unavailable")

    def insert_approval(self, approval: object, status: str) -> None:
        raise StoreError("unavailable")

    def search_documents(self, tenant_id: str, query: str, limit: int) -> list[object]:
        raise StoreError("unavailable")


def _human_session(row: tuple[object, ...]) -> HumanSession:
    created_at, last_seen_at, authenticated_at = (_epoch(row[4]), _epoch(row[5]), _epoch(row[6]))
    return HumanSession(
        session_id=str(row[0]),
        secret_hash=str(row[1]),
        owner_email=str(row[2]),
        owner_subject=str(row[3]),
        created_at=created_at,
        last_seen_at=last_seen_at,
        authenticated_at=authenticated_at,
        revoked=bool(row[7]),
    )


def _epoch(value: object) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    timestamp = getattr(value, "timestamp", None)
    if callable(timestamp):
        return float(timestamp())
    raise StoreError("session_clock")


def main() -> None:
    config = load_config(os.environ)
    service = build_service(config)
    serve(service, config.host, config.port)
