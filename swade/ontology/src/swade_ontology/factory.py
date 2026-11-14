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
    )


class _UnavailableStore:
    mode = "unavailable"

    def insert_credential(self, credential: object) -> None:
        raise StoreError("unavailable")

    def insert_approval(self, approval: object, status: str) -> None:
        raise StoreError("unavailable")

    def search_documents(self, tenant_id: str, query: str, limit: int) -> list[object]:
        raise StoreError("unavailable")


def main() -> None:
    config = load_config(os.environ)
    service = build_service(config)
    serve(service, config.host, config.port)
