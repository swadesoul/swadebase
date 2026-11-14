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


def build_service(config: Config | None = None) -> KnowledgeService:
    resolved = config or load_config()
    catalog = load_catalog()
    return KnowledgeService(
        config=resolved,
        catalog=catalog,
        policy=Policy(catalog),
        audit=AuditLog(),
        gateway=Gateway(
            resolved.gateway_url,
            resolved.gateway_key,
            local_model=resolved.local_model,
            paid_model=resolved.paid_model,
        ),
        brain=BrainClient(resolved.brain_search_url, resolved.brain_token),
        documents=MemoryDocumentIndex(),
        engine=EngineClient(resolved.engine_url, resolved.pin),
        owner=OwnerAuth(resolved.auth_url, resolved.owner_email),
    )


def main() -> None:
    config = load_config(os.environ)
    service = build_service(config)
    serve(service, config.host, config.port)
