"""Deny-by-default app and tenant authorization for SWADEBOTS and app clients."""

from __future__ import annotations

import hashlib
import hmac
import re
import uuid
from dataclasses import dataclass, replace

from .catalog import Catalog
from .config import PERSONAL_TENANT_ID
from .scopes import encode_scopes, parse_scopes, scopes_from_storage


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
    credential_id: str
    token_hash: str
    app_id: str
    tenant_id: str
    tenant_class: str
    caller_id: str
    caller_kind: str
    plan: str
    status: str
    scopes: tuple[str, ...]
    access: str


@dataclass(frozen=True)
class Caller:
    app_id: str
    tenant_id: str
    tenant_class: str
    caller_id: str
    caller_kind: str
    plan: str
    token_hash: str
    credential_id: str
    scopes: frozenset[str]


@dataclass(frozen=True)
class Decision:
    allowed: bool
    status: int
    code: str
    caller: Caller | None
    decision_id: str


@dataclass(frozen=True)
class Approval:
    approval_id: str
    credential_id: str
    action: str
    owner_email: str
    owner_subject: str


class Policy:
    def __init__(self, catalog: Catalog) -> None:
        self.catalog = catalog
        self._credentials: dict[str, Credential] = {}
        self._by_id: dict[str, str] = {}
        self.approvals: list[Approval] = []

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
        scopes: object,
        access: str = "read",
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
        if access != "read":
            raise ValueError("credentials are read-only")
        app = self.catalog.app(app_id)
        if app is None:
            raise ValueError("unknown app")
        parsed_scopes = parse_scopes(scopes, app.terms)
        credential = Credential(
            credential_id=str(uuid.uuid4()),
            token_hash=hash_token(token),
            app_id=app_id,
            tenant_id=tenant_id,
            tenant_class=tenant_class,
            caller_id=caller_id,
            caller_kind=caller_kind,
            plan=plan,
            status="pending",
            scopes=parsed_scopes,
            access="read",
        )
        self._credentials[credential.token_hash] = credential
        self._by_id[credential.credential_id] = credential.token_hash
        return credential

    def restore_credential(self, credential: Credential) -> None:
        if credential.status not in {"pending", "approved", "revoked"}:
            return
        if credential.tenant_class not in {"customer", "personal"}:
            return
        if credential.tenant_class == "personal" and credential.tenant_id != PERSONAL_TENANT_ID:
            return
        if credential.tenant_class == "customer" and credential.tenant_id == PERSONAL_TENANT_ID:
            return
        if credential.access != "read" or not credential.scopes or "*" in encode_scopes(credential.scopes):
            return
        app = self.catalog.app(credential.app_id)
        if app is None or scopes_from_storage(encode_scopes(credential.scopes), app.terms) != credential.scopes:
            return
        self._credentials[credential.token_hash] = credential
        self._by_id[credential.credential_id] = credential.token_hash

    def forget(self, credential_id: str) -> None:
        token_hash = self._by_id.pop(credential_id, None)
        if token_hash is not None:
            self._credentials.pop(token_hash, None)

    def get_credential(self, credential_id: str) -> Credential | None:
        token_hash = self._by_id.get(credential_id)
        if token_hash is None:
            return None
        return self._credentials.get(token_hash)

    def approve(self, credential_id: str, *, owner_email: str, owner_subject: str) -> Approval:
        return self._decide(credential_id, "approve", "approved", owner_email, owner_subject)

    def revoke(self, credential_id: str, *, owner_email: str, owner_subject: str) -> Approval:
        return self._decide(credential_id, "revoke", "revoked", owner_email, owner_subject)

    def _decide(
        self,
        credential_id: str,
        action: str,
        status: str,
        owner_email: str,
        owner_subject: str,
    ) -> Approval:
        credential = self.get_credential(credential_id)
        if credential is None:
            raise KeyError(credential_id)
        updated = replace(credential, status=status)
        self._credentials[credential.token_hash] = updated
        approval = Approval(
            approval_id=str(uuid.uuid4()),
            credential_id=credential_id,
            action=action,
            owner_email=owner_email.lower(),
            owner_subject=owner_subject,
        )
        self.approvals.append(approval)
        return approval

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
            credential_id=credential.credential_id,
            scopes=frozenset(credential.scopes),
        )
        if credential.status != "approved":
            code = "pending_approval" if credential.status == "pending" else "revoked"
            return self._deny(403, code, caller)
        return Decision(True, 200, "allow", caller, str(uuid.uuid4()))

    def authorize_tenant(self, caller: Caller, requested: str | None) -> Decision:
        if requested and requested != caller.tenant_id:
            return self._deny(403, "cross_tenant", caller)
        return Decision(True, 200, "allow", caller, str(uuid.uuid4()))

    def authorize_terms(self, caller: Caller, term_ids: list[str]) -> Decision:
        outside = [term_id for term_id in term_ids if term_id not in caller.scopes]
        if outside:
            return self._deny(403, "outside_scope", caller)
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
