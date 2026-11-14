"""SWADE read facade shared by the REST API and the MCP server."""

from __future__ import annotations

import json
import re
import secrets
from typing import Any

from . import __version__
from .audit import AuditLog
from .brain import BrainClient, DocumentHit
from .catalog import Catalog, Term
from .config import Config
from .engine import EngineClient
from .fts import MemoryDocumentIndex
from .gateway import Gateway
from .owner_auth import OwnerAuth
from .policy import Decision, Policy, bearer_token


_TOOLS = (
    {
        "name": "swade_search_terms",
        "description": "Search SWADE platform terms inside the caller scope.",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "name": "swade_get_term",
        "description": "Read one SWADE term the caller is allowed to see.",
        "inputSchema": {
            "type": "object",
            "properties": {"term_id": {"type": "string"}},
            "required": ["term_id"],
            "additionalProperties": False,
        },
    },
    {
        "name": "swade_check_answerable",
        "description": "Check whether a question stays inside the caller scope and the starter ontology.",
        "inputSchema": {
            "type": "object",
            "properties": {"question": {"type": "string"}},
            "required": ["question"],
            "additionalProperties": False,
        },
    },
    {
        "name": "swade_ask",
        "description": "Ask SWADE for scoped term definitions. SQL is not executed.",
        "inputSchema": {
            "type": "object",
            "properties": {"question": {"type": "string"}},
            "required": ["question"],
            "additionalProperties": False,
        },
    },
    {
        "name": "swade_search_documents",
        "description": "Search the caller tenant. Customer corpora stay in SSS Brain. Platform refs use Postgres full-text search.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
)


class KnowledgeService:
    def __init__(
        self,
        config: Config,
        catalog: Catalog,
        policy: Policy,
        audit: AuditLog,
        gateway: Gateway,
        brain: BrainClient,
        documents: MemoryDocumentIndex,
        engine: EngineClient,
        owner: OwnerAuth | None = None,
    ) -> None:
        self.config = config
        self.catalog = catalog
        self.policy = policy
        self.audit = audit
        self.gateway = gateway
        self.brain = brain
        self.documents = documents
        self.engine = engine
        self.owner = owner or OwnerAuth(None, None)

    def health(self) -> dict[str, Any]:
        return {
            "service": "SWADE",
            "component": "swade-ontology",
            "enabled": self.config.enabled,
            "engine_commit": self.engine.commit,
            "engine_configured": bool(self.engine.url),
            "kumo_rfm": "disabled",
            "document_search": "postgres-fts",
            "tenant_documents": "sss-brain" if self.brain.configured else "sss_brain_not_configured",
            "model_transport": "swade-ai-gateway",
            "gateway_configured": self.gateway.configured,
            "migrations": "not_applied",
            "personal_scope": "isolated",
            "agents": "SWADEBOTS",
            "owner_approval": "required",
            "owner_auth": "swadebase-google" if self.owner.configured else "not_configured",
        }

    def dispatch(
        self,
        method: str,
        path: str,
        headers: dict[str, str],
        query: dict[str, str],
        body: Any,
    ) -> tuple[int, dict[str, Any]]:
        normalized = {key.lower(): value for key, value in headers.items()}
        if method == "GET" and path == "/health":
            return 200, self.health()
        if method == "POST" and path == "/mcp":
            return self._mcp(normalized, body)
        if not self.config.enabled:
            return 503, {"error": {"code": "swade_ontology_disabled", "service": "SWADE"}}
        if path.startswith("/v1/admin"):
            return self._admin(method, path, normalized, body)
        decision = self.policy.authenticate(normalized)
        if not decision.allowed:
            self.audit.record(decision, "authenticate")
            return decision.status, self._error(decision)
        caller = decision.caller
        assert caller is not None
        requested = _requested_tenant(query, body)
        tenant_decision = self.policy.authorize_tenant(caller, requested)
        if not tenant_decision.allowed:
            self.audit.record(tenant_decision, path)
            return tenant_decision.status, self._error(tenant_decision)
        if method == "GET" and path == "/v1/terms":
            return self._list_terms(decision, query.get("q", ""))
        if method == "GET" and path.startswith("/v1/terms/"):
            return self._get_term(decision, path.removeprefix("/v1/terms/"))
        if method == "POST" and path == "/v1/answerable":
            return self._answerable(decision, body)
        if method == "POST" and path == "/v1/ask":
            return self._ask(decision, body)
        if method == "POST" and path == "/v1/documents/search":
            return self._documents(decision, body)
        if method == "GET" and path == "/v1/audit":
            return self._audit(decision)
        missing = self.policy._deny(404, "not_found", caller)
        self.audit.record(missing, path)
        return 404, self._error(missing)

    def _admin(self, method: str, path: str, headers: dict[str, str], body: Any) -> tuple[int, dict[str, Any]]:
        decision = self.owner.verify(bearer_token(headers) or "")
        if not decision.ok or decision.owner is None:
            denied = self.policy._deny(decision.status, decision.code, None)
            self.audit.record(denied, "admin.authenticate")
            return decision.status, {"error": {"code": decision.code, "service": "SWADE"}}
        owner = decision.owner
        if method == "GET" and path == "/v1/admin/approvals":
            allowed = self.policy._deny(200, "allow", None)
            self.audit.record(allowed, "admin.approvals", None)
            return 200, {
                "approvals": [
                    {
                        "approval_id": item.approval_id,
                        "credential_id": item.credential_id,
                        "action": item.action,
                        "owner_email": item.owner_email,
                        "owner_subject": item.owner_subject,
                    }
                    for item in self.policy.approvals
                    if item.owner_email == owner.email
                ]
            }
        if method == "POST" and path == "/v1/admin/credentials":
            return self._issue(owner.email, owner.subject, body)
        if method == "POST" and path.startswith("/v1/admin/credentials/"):
            remainder = path.removeprefix("/v1/admin/credentials/")
            credential_id, _, action = remainder.partition("/")
            if action == "approve":
                return self._owner_action(owner.email, owner.subject, credential_id, "approve")
            if action == "revoke":
                return self._owner_action(owner.email, owner.subject, credential_id, "revoke")
        missing = self.policy._deny(404, "not_found", None)
        self.audit.record(missing, "admin.unknown")
        return 404, {"error": {"code": "not_found", "service": "SWADE"}}

    def _issue(self, owner_email: str, owner_subject: str, body: Any) -> tuple[int, dict[str, Any]]:
        if not isinstance(body, dict):
            return 400, {"error": {"code": "credential_invalid", "service": "SWADE"}}
        required = ("app_id", "tenant_id", "tenant_class", "caller_id", "caller_kind", "plan")
        if any(not isinstance(body.get(key), str) or not body[key].strip() for key in required):
            return 400, {"error": {"code": "credential_invalid", "service": "SWADE"}}
        token = secrets.token_urlsafe(32)
        try:
            credential = self.policy.add_credential(
                token,
                app_id=body["app_id"].strip(),
                tenant_id=body["tenant_id"].strip(),
                tenant_class=body["tenant_class"].strip(),
                caller_id=body["caller_id"].strip(),
                caller_kind=body["caller_kind"].strip(),
                plan=body["plan"].strip(),
            )
        except ValueError:
            return 400, {"error": {"code": "credential_invalid", "service": "SWADE"}}
        recorded = self.policy._deny(201, "pending_approval", None)
        self.audit.record(recorded, "admin.credentials.issue")
        return 201, {
            "credential_id": credential.credential_id,
            "token": token,
            "status": "pending",
            "owner_email": owner_email,
            "owner_subject": owner_subject,
        }

    def _owner_action(
        self,
        owner_email: str,
        owner_subject: str,
        credential_id: str,
        action: str,
    ) -> tuple[int, dict[str, Any]]:
        try:
            if action == "approve":
                approval = self.policy.approve(
                    credential_id, owner_email=owner_email, owner_subject=owner_subject
                )
            else:
                approval = self.policy.revoke(
                    credential_id, owner_email=owner_email, owner_subject=owner_subject
                )
        except KeyError:
            missing = self.policy._deny(404, "not_available", None)
            self.audit.record(missing, f"admin.credentials.{action}")
            return 404, {"error": {"code": "not_available", "service": "SWADE"}}
        recorded = self.policy._deny(200, "allow", None)
        self.audit.record(recorded, f"admin.credentials.{action}")
        credential = self.policy.get_credential(credential_id)
        return 200, {
            "credential_id": approval.credential_id,
            "status": credential.status if credential else action,
            "approval_id": approval.approval_id,
            "owner_email": approval.owner_email,
            "owner_subject": approval.owner_subject,
        }

    def _list_terms(self, decision: Decision, query: str) -> tuple[int, dict[str, Any]]:
        caller = decision.caller
        assert caller is not None
        app = self.catalog.app(caller.app_id)
        assert app is not None
        terms = []
        for term_id in sorted(app.terms):
            term = self.catalog.terms.get(term_id)
            if term is None:
                continue
            if query and not _term_matches(term, query):
                continue
            terms.append(self._term_payload(term, app.terms))
        self.audit.record(decision, "terms.list", caller)
        return 200, {"terms": terms, "provenance": self._provenance(decision, ["starter-catalog"])}

    def _get_term(self, decision: Decision, term_id: str) -> tuple[int, dict[str, Any]]:
        caller = decision.caller
        assert caller is not None
        app = self.catalog.app(caller.app_id)
        term = self.catalog.terms.get(term_id)
        if app is None or term is None or term_id not in app.terms:
            hidden = self.policy._deny(404, "not_available", caller)
            self.audit.record(hidden, "terms.get", caller)
            return 404, self._error(hidden)
        self.audit.record(decision, "terms.get", caller)
        return 200, {
            "term": self._term_payload(term, app.terms),
            "provenance": self._provenance(decision, ["starter-catalog"]),
        }

    def _answerable(self, decision: Decision, body: Any) -> tuple[int, dict[str, Any]]:
        question = _question(body)
        if question is None:
            return 400, {"error": {"code": "question_required", "service": "SWADE"}}
        screened = self._screen(decision, question, "answerable")
        if screened is not None:
            return screened
        caller = decision.caller
        assert caller is not None
        term_ids = extract_term_ids(self.catalog, question)
        if not term_ids:
            self.audit.record(decision, "answerable", caller)
            return 200, {
                "answerable": False,
                "reason": "ontology_unmatched",
                "provenance": self._provenance(decision, ["starter-catalog"]),
            }
        allowed = self.policy.authorize_terms(caller, term_ids)
        if not allowed.allowed:
            self.audit.record(allowed, "answerable", caller)
            return allowed.status, self._error(allowed, outside=_outside(self.catalog, caller.app_id, term_ids))
        self.audit.record(allowed, "answerable", caller)
        return 200, {
            "answerable": True,
            "terms": term_ids,
            "provenance": self._provenance(allowed, ["starter-catalog"]),
        }

    def _ask(self, decision: Decision, body: Any) -> tuple[int, dict[str, Any]]:
        question = _question(body)
        if question is None:
            return 400, {"error": {"code": "question_required", "service": "SWADE"}}
        screened = self._screen(decision, question, "ask")
        if screened is not None:
            return screened
        caller = decision.caller
        assert caller is not None
        term_ids = extract_term_ids(self.catalog, question)
        if not term_ids:
            self.audit.record(decision, "ask", caller)
            return 200, {
                "answerable": False,
                "answer": None,
                "terms": [],
                "sql_executed": False,
                "narration": None,
                "provenance": self._provenance(decision, ["starter-catalog"]),
            }
        allowed = self.policy.authorize_terms(caller, term_ids)
        if not allowed.allowed:
            self.audit.record(allowed, "ask", caller)
            return allowed.status, self._error(allowed, outside=_outside(self.catalog, caller.app_id, term_ids))
        app = self.catalog.app(caller.app_id)
        assert app is not None
        payloads = [self._term_payload(self.catalog.terms[term_id], app.terms) for term_id in term_ids]
        narration = None
        model = None
        model_error = None
        if self.gateway.configured:
            prompt = _narration_prompt(question, payloads)
            result = self.gateway.narrate(caller.plan, prompt)
            narration = result.text
            model = result.model
            model_error = result.error
        self.audit.record(allowed, "ask", caller)
        return 200, {
            "answerable": True,
            "answer": "Starter definitions returned. SQL was not executed.",
            "terms": payloads,
            "sql_executed": False,
            "narration": narration,
            "model": model,
            "model_error": model_error,
            "provenance": self._provenance(allowed, ["starter-catalog"]),
        }

    def _documents(self, decision: Decision, body: Any) -> tuple[int, dict[str, Any]]:
        if not isinstance(body, dict) or not isinstance(body.get("query"), str) or not body["query"].strip():
            return 400, {"error": {"code": "query_required", "service": "SWADE"}}
        caller = decision.caller
        assert caller is not None
        limit = body.get("limit", 10)
        if not isinstance(limit, int) or isinstance(limit, bool):
            return 400, {"error": {"code": "limit_invalid", "service": "SWADE"}}
        try:
            bounded = max(1, min(20, limit))
        except TypeError:
            return 400, {"error": {"code": "limit_invalid", "service": "SWADE"}}
        query = body["query"].strip()
        screened = self.policy.screen_question(caller, query)
        if not screened.allowed:
            self.audit.record(screened, "documents.search", caller)
            return screened.status, self._error(screened)
        if self.brain.configured:
            result = self.brain.search(caller.tenant_id, query, bounded)
            if result.dropped:
                dropped = self.policy._deny(200, "brain_scope_filtered", caller)
                self.audit.record(dropped, "documents.search", caller)
            if result.error:
                failed = self.policy._deny(502, "brain_unavailable", caller)
                self.audit.record(failed, "documents.search", caller)
                return 502, self._error(failed)
            self.audit.record(decision, "documents.search", caller)
            return 200, {
                "hits": [_hit(hit) for hit in result.hits],
                "provenance": self._provenance(decision, ["sss-brain"], document_search="sss-brain"),
            }
        hits = self.documents.search(caller.tenant_id, query, bounded)
        self.audit.record(decision, "documents.search", caller)
        return 200, {
            "hits": [_hit(hit) for hit in hits],
            "tenant_documents": "sss_brain_not_configured",
            "provenance": self._provenance(decision, ["postgres-fts"], document_search="postgres-fts"),
        }

    def _audit(self, decision: Decision) -> tuple[int, dict[str, Any]]:
        caller = decision.caller
        assert caller is not None
        self.audit.record(decision, "audit.read_own", caller)
        events = [
            {
                "decision_id": event.decision_id,
                "at": event.at,
                "action": event.action,
                "outcome": event.outcome,
                "app_id": event.app_id,
                "tenant_id": event.tenant_id,
                "caller_id": event.caller_id,
            }
            for event in self.audit.for_caller(caller)
        ]
        return 200, {"events": events, "provenance": self._provenance(decision, ["audit"])}

    def _screen(self, decision: Decision, question: str, action: str) -> tuple[int, dict[str, Any]] | None:
        caller = decision.caller
        assert caller is not None
        screened = self.policy.screen_question(caller, question)
        if screened.allowed:
            return None
        self.audit.record(screened, action, caller)
        return screened.status, self._error(screened)

    def _mcp(self, headers: dict[str, str], body: Any) -> tuple[int, dict[str, Any]]:
        if not isinstance(body, dict) or body.get("jsonrpc") != "2.0":
            return 400, {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "invalid request"}}
        rpc_id = body.get("id")
        method = body.get("method")
        if method == "initialize":
            return 200, {
                "jsonrpc": "2.0",
                "id": rpc_id,
                "result": {
                    "protocolVersion": "2025-03-26",
                    "serverInfo": {"name": "swade-ontology", "title": "SWADE", "version": __version__},
                    "capabilities": {"tools": {}},
                    "instructions": (
                        "SWADEBOTS agents read SWADE through this server. "
                        "The credential carries app and tenant scope. Access is denied by default."
                    ),
                },
            }
        if method == "notifications/initialized":
            return 202, {"jsonrpc": "2.0", "id": rpc_id, "result": {}}
        if not self.config.enabled:
            return 200, _rpc_error(rpc_id, "swade_ontology_disabled")
        decision = self.policy.authenticate(headers)
        if not decision.allowed:
            self.audit.record(decision, "mcp.authenticate")
            return 200, _rpc_error(rpc_id, decision.code)
        if method == "tools/list":
            self.audit.record(decision, "mcp.tools.list", decision.caller)
            return 200, {"jsonrpc": "2.0", "id": rpc_id, "result": {"tools": list(_TOOLS)}}
        if method != "tools/call":
            return 200, {"jsonrpc": "2.0", "id": rpc_id, "error": {"code": -32601, "message": "method not found"}}
        params = body.get("params") if isinstance(body.get("params"), dict) else {}
        name = params.get("name")
        arguments = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}
        if "tenant_id" in arguments or "tenantId" in arguments:
            denied = self.policy._deny(403, "tenant_override", decision.caller)
            self.audit.record(denied, "mcp.tools.call", decision.caller)
            return 200, _tool_result(rpc_id, self._error(denied), is_error=True)
        status, payload = self._mcp_tool(decision, name, arguments)
        return 200, _tool_result(rpc_id, payload, is_error=status >= 400)

    def _mcp_tool(self, decision: Decision, name: object, arguments: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        if name == "swade_search_terms":
            return self._list_terms(decision, str(arguments.get("query", "")))
        if name == "swade_get_term":
            return self._get_term(decision, str(arguments.get("term_id", "")))
        if name == "swade_check_answerable":
            return self._answerable(decision, {"question": arguments.get("question")})
        if name == "swade_ask":
            return self._ask(decision, {"question": arguments.get("question")})
        if name == "swade_search_documents":
            return self._documents(
                decision,
                {"query": arguments.get("query"), "limit": arguments.get("limit", 10)},
            )
        missing = self.policy._deny(404, "tool_not_found", decision.caller)
        self.audit.record(missing, "mcp.tools.call", decision.caller)
        return 404, self._error(missing)

    def _term_payload(self, term: Term, granted: frozenset[str]) -> dict[str, Any]:
        return {
            "id": term.id,
            "name": term.name,
            "description": term.description,
            "synonyms": list(term.synonyms),
            "columns": [
                {"name": column.name, "description": column.description, "physical": column.physical}
                for column in term.columns
            ],
            "sql_attributes": [
                {
                    "id": attribute.id,
                    "description": attribute.description,
                    "expression": attribute.expression,
                    "executable": attribute.executable,
                    "certification": attribute.certification,
                }
                for attribute in term.sql_attributes
            ],
            "relationships": [
                {
                    "id": relationship.id,
                    "source": relationship.source,
                    "target": relationship.target,
                    "description": relationship.description,
                    "multiplicity": relationship.multiplicity,
                }
                for relationship in self.catalog.visible_relationships(term.id, granted)
            ],
        }

    def _provenance(
        self,
        decision: Decision,
        sources: list[str],
        *,
        document_search: str | None = None,
        engine_consulted: bool = False,
    ) -> dict[str, Any]:
        caller = decision.caller
        assert caller is not None
        return {
            "service": "SWADE",
            "component": "swade-ontology",
            "agents": "SWADEBOTS",
            "catalog_version": self.catalog.version,
            "certification": self.catalog.certification,
            "sources": sources,
            "sql_executed": False,
            "engine": {
                "commit": self.engine.commit,
                "consulted": engine_consulted,
            },
            "document_search": document_search,
            "policy_decision_id": decision.decision_id,
            "app_id": caller.app_id,
            "tenant_id": caller.tenant_id,
            "tenant_class": caller.tenant_class,
            "caller_id": caller.caller_id,
            "caller_kind": caller.caller_kind,
        }

    def _error(self, decision: Decision, outside: list[str] | None = None) -> dict[str, Any]:
        body: dict[str, Any] = {
            "error": {"code": decision.code, "service": "SWADE"},
        }
        if outside:
            body["error"]["terms"] = outside
        if decision.caller is not None:
            body["provenance"] = {
                "service": "SWADE",
                "policy_decision_id": decision.decision_id,
                "app_id": decision.caller.app_id,
                "tenant_id": decision.caller.tenant_id,
                "tenant_class": decision.caller.tenant_class,
                "caller_id": decision.caller.caller_id,
            }
        return body


def extract_term_ids(catalog: Catalog, question: str) -> list[str]:
    found: list[str] = []
    for term in catalog.terms.values():
        phrases = (term.id, term.name, *term.synonyms)
        if any(_contains_phrase(question, phrase) for phrase in phrases):
            found.append(term.id)
    return found


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"(?<![a-z0-9]){re.escape(phrase.lower())}s?(?![a-z0-9])", text.lower()) is not None


def _term_matches(term: Term, query: str) -> bool:
    phrases = (term.id, term.name, *term.synonyms)
    if any(_contains_phrase(phrase, query) or _contains_phrase(query, phrase) for phrase in phrases):
        return True
    for word in re.findall(r"[a-z0-9]{3,}", query.lower()):
        if any(_contains_phrase(phrase, word) for phrase in phrases):
            return True
    return False


def _outside(catalog: Catalog, app_id: str, term_ids: list[str]) -> list[str]:
    app = catalog.app(app_id)
    granted = app.terms if app else frozenset()
    return [term_id for term_id in term_ids if term_id not in granted]


def _question(body: Any) -> str | None:
    if not isinstance(body, dict) or not isinstance(body.get("question"), str):
        return None
    question = body["question"].strip()
    return question or None


def _requested_tenant(query: dict[str, str], body: Any) -> str | None:
    if query.get("tenant_id"):
        return query["tenant_id"]
    if isinstance(body, dict) and isinstance(body.get("tenant_id"), str):
        return body["tenant_id"]
    return None


def _hit(hit: DocumentHit) -> dict[str, str]:
    return {
        "id": hit.id,
        "tenant_id": hit.tenant_id,
        "title": hit.title,
        "excerpt": hit.excerpt,
        "source": hit.source,
    }


def _narration_prompt(question: str, terms: list[dict[str, Any]]) -> str:
    definitions = []
    for term in terms:
        attributes = ", ".join(
            f"{item['id']} ({item['expression']})" for item in term["sql_attributes"]
        )
        definitions.append(f"{term['name']}: {term['description']} Measures: {attributes}.")
    return (
        "Explain the following certified starter definitions. "
        "Do not invent numbers, joins, or tenant data. SQL was not executed.\n"
        f"Question: {question}\n" + "\n".join(definitions)
    )


def _rpc_error(rpc_id: Any, code: str) -> dict[str, Any]:
    return _tool_result(rpc_id, {"error": {"code": code, "service": "SWADE"}}, is_error=True)


def _tool_result(rpc_id: Any, payload: dict[str, Any], *, is_error: bool) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0",
        "id": rpc_id,
        "result": {
            "content": [{"type": "text", "text": json.dumps(payload)}],
            "isError": is_error,
        },
    }
