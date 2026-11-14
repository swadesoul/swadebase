"""Deny-by-default app and tenant authorization for SWADEBOTS and app clients."""

from __future__ import annotations

import hashlib
import hmac
import re
import uuid
from dataclasses import dataclass

from .catalog import Catalog
from .config import PERSONAL_TENANT_ID


_SERVICE_ROLE_MARKER = "service_role"
_PERSONAL_MARKERS = (
    "swade-personal",
    "personal knowledge",
    "personal notes",
    "owner notes",
    "god's eye",
    "gods eye",
    "sapphire",
)


@dataclass(frozen=True)
class Credential:
    token_hash: str
    app_id: str
    tenant_id: str
    tenant_class: str
    caller_id: str
    caller_kind: str
    plan: str


@dataclass(frozen=True)
class Caller:
    app_id: str
    tenant_id: str
    tenant_class: str
    caller_id: str
    caller_kind: str
    plan: str
    token_hash: str


@dataclass(frozen=True)
class Decision:
    allowed: bool
    status: int
    code: str
    caller: Caller | None
    decision_id: str


class Policy:
    def __init__(self, catalog: Catalog) -> None:
        self.catalog = catalog
        self._credentials: dict[str, Credential] = {}

    def add_credential(
        self,
        token: str,
        *,
        app_id: str,
        tenant_id: str,
        tenant_class: str,
        caller_id: str,
        caller_kind: str,
        plan: str,
    ) -> Credential:
        if len(token) < 16:
            raise ValueError("credential tokens must be at least 16 characters")
        if _looks_like_service_role(token):
            raise ValueError("service-role tokens cannot be credentials")
        if tenant_class not in ("customer", "personal"):
            raise ValueError("tenant_class must be customer or personal")
        if plan not in ("free", "paid"):
            raise ValueError("plan must be free or paid")
        if caller_kind not in ("swadebots", "app"):
            raise ValueError("caller_kind must be swadebots or app")
        if tenant_class == "personal" and tenant_id != PERSONAL_TENANT_ID:
            raise ValueError("personal credentials are bound to the personal tenant")
        if tenant_class == "customer" and tenant_id == PERSONAL_TENANT_ID:
            raise ValueError("customer credentials cannot use the personal tenant")
        if len(tenant_id) < 8:
            raise ValueError("tenant ids must be at least 8 characters")
        credential = Credential(
            token_hash=hash_token(token),
            app_id=app_id,
            tenant_id=tenant_id,
            tenant_class=tenant_class,
            caller_id=caller_id,
            caller_kind=caller_kind,
            plan=plan,
        )
        self._credentials[credential.token_hash] = credential
        return credential

    def known_tenant_ids(self) -> set[str]:
        ids = {PERSONAL_TENANT_ID}
        ids.update(item.tenant_id for item in self._credentials.values())
        return ids

    def authenticate(self, headers: dict[str, str]) -> Decision:
        client = headers.get("x-swadebots-client")
        if client is not None and client != "swadebots":
            return self._deny(403, "client_not_swadebots", None)
        token = bearer_token(headers)
        if not token:
            return self._deny(401, "unauthenticated", None)
        if _looks_like_service_role(token):
            return self._deny(403, "service_role_rejected", None)
        credential = self._credentials.get(hash_token(token))
        if credential is None:
            return self._deny(401, "unauthenticated", None)
        app = self.catalog.app(credential.app_id)
        if app is None:
            return self._deny(403, "app_not_granted", None)
        if app.requires_tenant_class != credential.tenant_class:
            return self._deny(403, "tenant_class_mismatch", None)
        if credential.tenant_class == "personal" and credential.tenant_id != PERSONAL_TENANT_ID:
            return self._deny(403, "personal_scope", None)
        if credential.tenant_class == "customer" and credential.tenant_id == PERSONAL_TENANT_ID:
            return self._deny(403, "personal_scope", None)
        caller = Caller(
            app_id=credential.app_id,
            tenant_id=credential.tenant_id,
            tenant_class=credential.tenant_class,
            caller_id=credential.caller_id,
            caller_kind=credential.caller_kind,
            plan=credential.plan,
            token_hash=credential.token_hash,
        )
        return Decision(True, 200, "allow", caller, str(uuid.uuid4()))

    def authorize_tenant(self, caller: Caller, requested: str | None) -> Decision:
        if requested and requested != caller.tenant_id:
            return self._deny(403, "cross_tenant", caller)
        return Decision(True, 200, "allow", caller, str(uuid.uuid4()))

    def authorize_terms(self, caller: Caller, term_ids: list[str]) -> Decision:
        app = self.catalog.app(caller.app_id)
        granted = app.terms if app else frozenset()
        outside = [term_id for term_id in term_ids if term_id not in granted]
        if outside:
            return self._deny(403, "outside_app_scope", caller)
        return Decision(True, 200, "allow", caller, str(uuid.uuid4()))

    def screen_question(self, caller: Caller, question: str) -> Decision:
        text = question.lower()
        if caller.tenant_class != "personal":
            for marker in _PERSONAL_MARKERS:
                if marker in text:
                    return self._deny(403, "personal_scope", caller)
        for tenant_id in self.known_tenant_ids():
            if tenant_id == caller.tenant_id:
                continue
            if _contains_token(text, tenant_id.lower()):
                return self._deny(403, "cross_tenant", caller)
        return Decision(True, 200, "allow", caller, str(uuid.uuid4()))

    def _deny(self, status: int, code: str, caller: Caller | None) -> Decision:
        return Decision(False, status, code, caller, str(uuid.uuid4()))


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def tokens_match(presented: str, stored_hash: str) -> bool:
    return hmac.compare_digest(hash_token(presented), stored_hash)


def bearer_token(headers: dict[str, str]) -> str | None:
    authorization = headers.get("authorization", "")
    api_key = headers.get("x-api-key")
    token = None
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if api_key and token and api_key.strip() != token:
        return None
    if api_key and not token:
        token = api_key.strip()
    return token or None


def _looks_like_service_role(token: str) -> bool:
    return _SERVICE_ROLE_MARKER in token.lower()


def _contains_token(text: str, token: str) -> bool:
    return re.search(rf"(?<![a-z0-9-]){re.escape(token)}(?![a-z0-9-])", text) is not None
