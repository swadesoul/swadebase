"""Unit, authorization, and tenant-isolation tests for SWADE."""

from __future__ import annotations

import json
import shutil
import sys
import threading
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "sdk" / "python"))

from swade_ontology.audit import AuditLog  # noqa: E402
from swade_ontology.brain import BrainClient  # noqa: E402
from swade_ontology.catalog import load_catalog  # noqa: E402
from swade_ontology.config import ConfigError, load_config  # noqa: E402
from swade_ontology.engine import EngineClient  # noqa: E402
from swade_ontology.fts import MemoryDocumentIndex, StoredDocument, fts_statement  # noqa: E402
from swade_ontology.gateway import Gateway  # noqa: E402
from swade_ontology.http_server import bind  # noqa: E402
from swade_ontology.owner_auth import OwnerAuth  # noqa: E402
from swade_ontology.policy import Policy  # noqa: E402
from swade_ontology.scopes import explicit_scopes_for  # noqa: E402
from swade_ontology.rehearse import (  # noqa: E402
    MIGRATION_PATH,
    RecordingConnection,
    RehearsalError,
    main as rehearse_main,
    rehearse,
)
from swade_ontology.service import KnowledgeService  # noqa: E402
from swade_ontology_sdk import SwadeClient, SwadeError  # noqa: E402


PIN = "8ede47f7b67bf2612c5322c7a9adb8e0c6190e38"
ALPHA = "tenant-alpha"
BRAVO = "tenant-bravo"
PERSONAL = "swade-personal"
CALLER = "swadebots.maestro-radio"


def config(enabled: bool = True, **overrides: str) -> object:
    env = {"SWADE_ONTOLOGY_ENABLED": "true" if enabled else "false"}
    env.update(overrides)
    return load_config(env)


def service_for(enabled: bool = True, **overrides: object) -> KnowledgeService:
    catalog = load_catalog()
    policy = Policy(catalog)
    documents = MemoryDocumentIndex()
    documents.add(StoredDocument("alpha-1", ALPHA, "Alpha spin log", "station one aired a track scope-marker"))
    documents.add(StoredDocument("bravo-1", BRAVO, "Bravo secret", "bravo private airing scope-marker"))
    documents.add(
        StoredDocument("personal-1", PERSONAL, "Owner notebook", "personal knowledge stays here scope-marker")
    )
    gateway = overrides.pop("gateway", Gateway(None, None))
    brain = overrides.pop("brain", BrainClient(None, None))
    owner = overrides.pop("owner", None)
    store = overrides.pop("store", None)
    sessions = overrides.pop("sessions", None)
    documents = overrides.pop("documents", documents)
    return KnowledgeService(
        config=config(enabled),
        catalog=catalog,
        policy=policy,
        audit=AuditLog(),
        gateway=gateway,
        brain=brain,
        documents=documents,
        engine=EngineClient(None, load_config({}).pin),
        owner=owner,
        store=store,
        sessions=sessions,
    )


def grant(policy: Policy, token: str, app_id: str, tenant_id: str, tenant_class: str, plan: str = "free") -> None:
    credential = policy.add_credential(
        token,
        app_id=app_id,
        tenant_id=tenant_id,
        tenant_class=tenant_class,
        caller_id=CALLER if tenant_class == "customer" else "swadebots.personal",
        caller_kind="swadebots",
        plan=plan,
        scopes=explicit_scopes_for(policy.catalog.app(app_id).terms),
    )
    policy.approve(credential.credential_id, owner_email="owner@example.com", owner_subject="owner-subject")


def auth(token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}", "x-swadebots-client": "swadebots"}


def operator_headers(service: KnowledgeService, access_token: str) -> dict[str, str]:
    cookies: list[str] = []
    status, body = service.dispatch(
        "POST",
        "/v1/admin/session",
        {},
        {},
        {"access_token": access_token},
        cookies,
    )
    if status != 200:
        raise AssertionError((status, body))
    header = cookies[-1]
    secret = header.split(";", 1)[0].split(".", 1)[1]
    encoded = json.dumps(body)
    if secret in encoded or access_token in encoded:
        raise AssertionError("session response exposed a token")
    return {"cookie": header.split(";", 1)[0]}


class ConfigTests(unittest.TestCase):
    def test_flag_is_off_unless_exactly_true(self) -> None:
        self.assertFalse(load_config({}).enabled)
        self.assertFalse(load_config({"SWADE_ONTOLOGY_ENABLED": "TRUE"}).enabled)
        self.assertFalse(load_config({"SWADE_ONTOLOGY_ENABLED": "1"}).enabled)
        self.assertTrue(load_config({"SWADE_ONTOLOGY_ENABLED": "true"}).enabled)

    def test_pin_matches_the_engine_file(self) -> None:
        pin = load_config({}).pin
        self.assertEqual(pin.commit, PIN)
        self.assertIn(PIN, (ROOT / "engine" / "PIN").read_text(encoding="utf-8"))
        self.assertEqual(pin.license_id, "Apache-2.0")

    def test_rejects_hosted_keys_kumo_and_the_platform_database(self) -> None:
        with self.assertRaises(ConfigError):
            load_config({"SWADE_AI_GATEWAY_KEY": "nvapi-example"})
        with self.assertRaises(ConfigError):
            load_config({"KUMO_RFM_API_KEY": "upload-tables"})
        with self.assertRaises(ConfigError):
            load_config({"SWADE_AI_GATEWAY_URL": "https://integrate.api.nvidia.com/v1"})
        with self.assertRaises(ConfigError):
            load_config({"SWADE_ONTOLOGY_DATABASE_URL": "postgresql://postgres:pw@db:5432/postgres"})
        with self.assertRaises(ConfigError):
            load_config({"SWADE_ONTOLOGY_ALLOW_SERVICE_ROLE": "true"})
        with self.assertRaises(ConfigError):
            load_config({"SSS_BRAIN_READ_TOKEN": "service_role-secret"})
        with self.assertRaises(ConfigError):
            load_config({"SWADE_ONTOLOGY_LOCAL_MODEL": "gpt-4o"})
        with self.assertRaises(ConfigError):
            load_config({"SWADEBASE_AUTH_URL": "https://accounts.google.com"})

    def test_google_client_secret_is_not_kept(self) -> None:
        loaded = load_config({"GOOGLE_SECRET": "not-a-committed-secret", "GOOGLE_CLIENT_ID": "client-id"})
        self.assertNotIn("not-a-committed-secret", repr(loaded))
        self.assertIsNone(loaded.owner_email)

    def test_service_role_key_is_not_reused(self) -> None:
        with self.assertRaises(ConfigError):
            load_config(
                {
                    "SWADEBASE_SERVICE_ROLE_KEY": "platform-secret",
                    "SSS_BRAIN_READ_TOKEN": "platform-secret",
                }
            )


class CatalogTests(unittest.TestCase):
    def test_starter_ontology_covers_shared_entities(self) -> None:
        catalog = load_catalog()
        expected = {
            "artist",
            "track",
            "station",
            "spin",
            "attribution",
            "order",
            "royalty",
            "consent",
            "course",
            "lesson",
            "exam",
            "source",
            "tenant",
            "book",
        }
        self.assertTrue(expected <= set(catalog.terms))
        for term in catalog.terms.values():
            for attribute in term.sql_attributes:
                self.assertFalse(attribute.executable)
                self.assertEqual(attribute.certification, "starter")
        apps = set(catalog.apps)
        self.assertTrue(
            {
                "maestro-radio",
                "swade-radio",
                "resinglab",
                "black-tales",
                "teachvirt",
                "virtteach",
                "my-distribution",
                "sss-brain",
                "swade-personal",
            }
            <= apps
        )


class IsolationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = service_for()
        grant(self.service.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer")
        grant(self.service.policy, "maestro-bravo-token", "maestro-radio", BRAVO, "customer")
        grant(self.service.policy, "teach-alpha-tokenx", "teachvirt", ALPHA, "customer")
        grant(self.service.policy, "personal-scope-token", "swade-personal", PERSONAL, "personal")

    def test_disabled_facade_returns_no_knowledge(self) -> None:
        disabled = service_for(False, gateway=Gateway("http://gateway.internal/v1", None))

        def explode(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
            raise AssertionError("gateway called while disabled")

        disabled.gateway.transport = explode
        status, body = disabled.dispatch("GET", "/health", {}, {}, None)
        self.assertEqual(status, 200)
        self.assertFalse(body["enabled"])
        self.assertEqual(body["service"], "SWADE")
        self.assertEqual(body["agents"], "SWADEBOTS")
        status, body = disabled.dispatch("GET", "/v1/terms", auth("maestro-alpha-token"), {}, None)
        self.assertEqual(status, 503)
        self.assertEqual(body["error"]["code"], "swade_ontology_disabled")
        self.assertNotIn("terms", body)

    def test_missing_and_service_role_credentials_are_denied(self) -> None:
        status, body = self.service.dispatch("GET", "/v1/terms", {}, {}, None)
        self.assertEqual(status, 401)
        status, body = self.service.dispatch(
            "GET",
            "/v1/terms",
            {"authorization": "Bearer service_role"},
            {},
            None,
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "service_role_rejected")
        status, body = self.service.dispatch(
            "GET",
            "/v1/terms",
            {"authorization": "Bearer maestro-alpha-token", "x-swadebots-client": "other-bot"},
            {},
            None,
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "client_not_swadebots")

    def test_radio_cannot_read_teaching_terms(self) -> None:
        status, body = self.service.dispatch("GET", "/v1/terms", auth("maestro-alpha-token"), {}, None)
        self.assertEqual(status, 200)
        ids = {term["id"] for term in body["terms"]}
        self.assertTrue({"track", "artist", "station", "spin", "attribution"} <= ids)
        self.assertNotIn("exam", ids)
        self.assertNotIn("royalty", ids)
        status, body = self.service.dispatch("GET", "/v1/terms/exam", auth("maestro-alpha-token"), {}, None)
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "outside_scope")
        self.assertNotIn("expression", json.dumps(body))
        status, body = self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": "has this student unlocked this exam?"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "outside_scope")
        self.assertNotIn("exam_progress", json.dumps(body))

    def test_teaching_cannot_read_radio_attribution(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/v1/answerable",
            auth("teach-alpha-tokenx"),
            {},
            {"question": "which attribution followed this spin?"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "outside_scope")

    def test_cross_tenant_and_personal_scope_stay_apart(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": "how many spins aired", "tenant_id": BRAVO},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "cross_tenant")
        status, body = self.service.dispatch(
            "GET",
            "/v1/terms",
            auth("maestro-alpha-token"),
            {"tenant_id": PERSONAL},
            None,
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "cross_tenant")
        status, body = self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": f"show spins for {BRAVO}"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "cross_tenant")
        status, body = self.service.dispatch(
            "POST",
            "/v1/documents/search",
            auth("maestro-alpha-token"),
            {},
            {"query": "personal knowledge"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "personal_scope")
        self.assertNotIn("Owner notebook", json.dumps(body))
        status, body = self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("personal-scope-token"),
            {},
            {"question": f"spins for {ALPHA}"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "cross_tenant")

    def test_document_hits_do_not_cross_tenants(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/v1/documents/search",
            auth("maestro-alpha-token"),
            {},
            {"query": "scope-marker"},
        )
        self.assertEqual(status, 200)
        self.assertEqual([hit["tenant_id"] for hit in body["hits"]], [ALPHA])
        self.assertEqual(body["provenance"]["document_search"], "postgres-fts")
        self.assertNotIn("Bravo secret", json.dumps(body))
        self.assertNotIn("Owner notebook", json.dumps(body))
        status, personal = self.service.dispatch(
            "POST",
            "/v1/documents/search",
            auth("personal-scope-token"),
            {},
            {"query": "notebook"},
        )
        self.assertEqual(status, 200)
        self.assertEqual([hit["tenant_id"] for hit in personal["hits"]], [PERSONAL])

    def test_sss_brain_hits_from_another_tenant_are_dropped(self) -> None:
        def transport(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
            self.assertNotIn("service_role", headers.get("authorization", ""))
            return 200, json.dumps(
                {
                    "hits": [
                        {"id": "a", "tenant_id": ALPHA, "title": "Alpha note", "excerpt": "alpha only"},
                        {"id": "b", "tenant_id": BRAVO, "title": "Bravo note", "excerpt": "bravo only"},
                        {"id": "p", "tenant_id": PERSONAL, "title": "Owner note", "excerpt": "personal only"},
                    ]
                }
            ).encode()

        brain = BrainClient("http://sss-brain.internal/search", "scoped-read-token", transport)
        scoped = service_for(brain=brain)
        grant(scoped.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer")
        status, body = scoped.dispatch(
            "POST",
            "/v1/documents/search",
            auth("maestro-alpha-token"),
            {},
            {"query": "note"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["hits"], [
            {
                "id": "a",
                "tenant_id": ALPHA,
                "title": "Alpha note",
                "excerpt": "alpha only",
                "source": "sss-brain",
            }
        ])
        self.assertEqual(body["provenance"]["document_search"], "sss-brain")

    def test_audit_events_stay_with_the_caller_tenant(self) -> None:
        self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": "how many spins aired"},
        )
        self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-bravo-token"),
            {},
            {"question": "how many spins aired"},
        )
        status, body = self.service.dispatch("GET", "/v1/audit", auth("maestro-alpha-token"), {}, None)
        self.assertEqual(status, 200)
        self.assertTrue(body["events"])
        self.assertTrue(all(event["tenant_id"] == ALPHA for event in body["events"]))
        self.assertNotIn(BRAVO, json.dumps(body))

    def test_customer_credential_cannot_pose_as_the_personal_app(self) -> None:
        self.service.policy.add_credential(
            "posed-personal-token",
            app_id="swade-personal",
            tenant_id=ALPHA,
            tenant_class="customer",
            caller_id="swadebots.personal",
            caller_kind="swadebots",
            plan="free",
            scopes=explicit_scopes_for(self.service.catalog.app("swade-personal").terms),
        )
        status, body = self.service.dispatch("GET", "/v1/terms", auth("posed-personal-token"), {}, None)
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "tenant_class_mismatch")

    def test_personal_credential_cannot_be_issued_for_a_customer_tenant(self) -> None:
        with self.assertRaises(ValueError):
            self.service.policy.add_credential(
                "bad-personal-tokenx",
                app_id="swade-personal",
                tenant_id=ALPHA,
                tenant_class="personal",
                caller_id="swadebots.personal",
                caller_kind="swadebots",
                plan="free",
                scopes=["radio:spin"],
            )

    def test_radio_relationships_hide_ungranted_terms(self) -> None:
        status, body = self.service.dispatch(
            "GET",
            "/v1/terms/attribution",
            auth("maestro-alpha-token"),
            {},
            None,
        )
        self.assertEqual(status, 200)
        targets = {item["target"] for item in body["term"]["relationships"]}
        self.assertIn("spin", targets)
        self.assertNotIn("order", targets)

    def test_ask_provenance_and_unexecuted_sql(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": "how many spins aired"},
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["answerable"])
        self.assertFalse(body["sql_executed"])
        self.assertIsNone(body["narration"])
        self.assertEqual(body["provenance"]["service"], "SWADE")
        self.assertEqual(body["provenance"]["agents"], "SWADEBOTS")
        self.assertEqual(body["provenance"]["tenant_id"], ALPHA)
        self.assertEqual(body["provenance"]["tenant_class"], "customer")
        self.assertEqual(body["provenance"]["certification"], "starter")
        self.assertEqual(body["provenance"]["engine"]["commit"], PIN)
        self.assertFalse(body["provenance"]["engine"]["consulted"])
        self.assertTrue(body["provenance"]["policy_decision_id"])


class GatewayTests(unittest.TestCase):
    def test_free_callers_stay_on_the_local_model_and_errors_do_not_retry(self) -> None:
        calls: list[str] = []

        def transport(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
            self.assertEqual(url, "http://gateway.internal/v1/chat/completions")
            self.assertNotIn("nvidia.com", url)
            calls.append(json.loads(payload)["model"])
            return 500, b""

        gateway = Gateway(
            "http://gateway.internal/v1",
            "gateway-token",
            paid_model="auto/cheap",
            transport=transport,
        )
        scoped = service_for(gateway=gateway)
        grant(scoped.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer", plan="free")
        status, body = scoped.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": "how many spins aired", "model": "gpt-4o"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(calls, ["auto/offline"])
        self.assertEqual(body["model"], "auto/offline")
        self.assertEqual(body["model_error"], "gateway_status_500")
        self.assertIsNone(body["narration"])
        self.assertFalse(body["sql_executed"])

    def test_paid_callers_use_one_explicit_gateway_model(self) -> None:
        calls: list[str] = []

        def transport(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
            calls.append(json.loads(payload)["model"])
            return 200, json.dumps({"choices": [{"message": {"content": "one airing"}}]}).encode()

        gateway = Gateway(
            "http://gateway.internal/v1",
            None,
            paid_model="auto/cheap",
            transport=transport,
        )
        scoped = service_for(gateway=gateway)
        grant(scoped.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer", plan="paid")
        status, body = scoped.dispatch(
            "POST",
            "/v1/ask",
            auth("maestro-alpha-token"),
            {},
            {"question": "how many spins aired"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(calls, ["auto/cheap"])
        self.assertEqual(body["narration"], "one airing")


class FtsAndMigrationTests(unittest.TestCase):
    def test_full_text_query_stays_parameterized(self) -> None:
        injected = "aired'; drop table swade_ontology.document_refs; --"
        sql, params = fts_statement(ALPHA, injected, 5)
        self.assertNotIn(injected, sql)
        self.assertNotIn("pgvector", sql)
        self.assertEqual(params, (ALPHA, injected, injected, 5))
        self.assertIn("websearch_to_tsquery", sql)

    def test_migration_rehearsal_rolls_back_and_refuses_other_databases(self) -> None:
        sql = MIGRATION_PATH.read_text(encoding="utf-8")
        self.assertNotIn("pgvector", sql.lower())
        connection = RecordingConnection()
        rehearse(sql, connection, "swade_ontology")
        self.assertEqual(connection.statements[0], "BEGIN")
        self.assertEqual(connection.statements[-1], "ROLLBACK")
        self.assertFalse(connection.committed)
        with self.assertRaises(RehearsalError):
            rehearse(sql, RecordingConnection(), "postgres")
        self.assertEqual(rehearse_main(env={}), 0)
        self.assertEqual(
            rehearse_main(env={"SWADE_ONTOLOGY_DATABASE_URL": "postgresql://u:p@db/postgres"}),
            2,
        )

    def test_isolated_url_does_not_connect_without_psql(self) -> None:
        original = shutil.which
        shutil_module = sys.modules["swade_ontology.rehearse"].shutil
        shutil_module.which = lambda name: None
        try:
            code = rehearse_main(
                env={"SWADE_ONTOLOGY_DATABASE_URL": "postgresql://swade_ontology:pw@127.0.0.1:1/swade_ontology"}
            )
        finally:
            shutil_module.which = original
        self.assertEqual(code, 2)


class McpTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = service_for()
        grant(self.service.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer")

    def test_initialize_names_swade_and_swadebots(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/mcp",
            {},
            {},
            {"jsonrpc": "2.0", "id": 1, "method": "initialize"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["result"]["serverInfo"]["name"], "swade-ontology")
        self.assertEqual(body["result"]["serverInfo"]["title"], "SWADE")
        self.assertIn("SWADEBOTS", body["result"]["instructions"])
        self.assertIn("shared map of meanings", body["result"]["instructions"])
        self.assertLess(len(body["result"]["instructions"].split()), 200)
        health = self.service.dispatch("GET", "/health", {}, {}, None)[1]
        self.assertEqual(health["description"], body["result"]["instructions"])
        self.assertIn("docs/PRIMER.md", (ROOT / "README.md").read_text(encoding="utf-8"))

    def test_disabled_tool_call_returns_no_terms(self) -> None:
        disabled = service_for(False)
        status, body = disabled.dispatch(
            "POST",
            "/mcp",
            auth("maestro-alpha-token"),
            {},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "swade_search_terms", "arguments": {"query": "exam"}}},
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["result"]["isError"])
        self.assertIn("swade_ontology_disabled", body["result"]["content"][0]["text"])
        self.assertNotIn("exam_progress", body["result"]["content"][0]["text"])

    def test_tool_call_cannot_override_tenant(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/mcp",
            auth("maestro-alpha-token"),
            {},
            {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {
                    "name": "swade_search_documents",
                    "arguments": {"query": "aired", "tenant_id": BRAVO},
                },
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["result"]["isError"])
        self.assertIn("tenant_override", body["result"]["content"][0]["text"])

    def test_scoped_tool_call_returns_provenance(self) -> None:
        status, body = self.service.dispatch(
            "POST",
            "/mcp",
            auth("maestro-alpha-token"),
            {},
            {
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {"name": "swade_ask", "arguments": {"question": "how many spins aired"}},
            },
        )
        self.assertEqual(status, 200)
        self.assertFalse(body["result"]["isError"])
        payload = json.loads(body["result"]["content"][0]["text"])
        self.assertEqual(payload["provenance"]["tenant_id"], ALPHA)
        self.assertFalse(payload["sql_executed"])


class HttpSdkTests(unittest.TestCase):
    def test_python_sdk_reads_through_the_facade(self) -> None:
        scoped = service_for()
        grant(scoped.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer")
        server = bind(scoped)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            port = server.server_address[1]
            client = SwadeClient(f"http://127.0.0.1:{port}", "maestro-alpha-token")
            health = client.health()
            self.assertEqual(health["service"], "SWADE")
            self.assertTrue(health["enabled"])
            answer = client.ask("how many spins aired")
            self.assertEqual(answer["provenance"]["caller_kind"], "swadebots")
            self.assertFalse(answer["sql_executed"])
            with self.assertRaises(SwadeError) as raised:
                client.term("exam")
            self.assertEqual(raised.exception.status, 403)
        finally:
            server.shutdown()
            server.server_close()


class ComposeTests(unittest.TestCase):
    def test_service_is_isolated_from_the_supabase_tree(self) -> None:
        self.assertEqual(ROOT.name, "ontology")
        self.assertEqual(ROOT.parent.name, "swade")
        self.assertFalse((ROOT.parent / "bots").resolve() == ROOT.resolve())

    def test_default_stack_is_off_and_isolated(self) -> None:
        text = (ROOT / "docker-compose.coolify.yml").read_text(encoding="utf-8")
        engine = (ROOT / "docker-compose.engine.yml").read_text(encoding="utf-8")
        self.assertIn("SWADE_ONTOLOGY_ENABLED: ${SWADE_ONTOLOGY_ENABLED:-false}", text)
        self.assertNotIn('SWADE_ONTOLOGY_ENABLED: "false"', text)
        self.assertIn("postgres:17-alpine", text)
        self.assertNotIn("pgvector", text)
        self.assertNotIn("nvapi-", text)
        self.assertNotIn("3001:3001", text)
        self.assertNotIn("3002:3002", text)
        self.assertIn("8090:8090", text)
        self.assertIn('profiles: ["engine"]', engine)
        self.assertIn("pgvector/pgvector:pg17", engine)
        self.assertNotIn("ports:", engine)
        self.assertNotIn("nvapi-", engine)
        self.assertNotIn("KUMO_RFM_API_KEY", engine)
        self.assertIn(PIN, engine)
        self.assertNotIn("GOOGLE_SECRET", text)
        self.assertIn("SWADEBASE_AUTH_URL", text)


class OwnerApprovalTests(unittest.TestCase):
    def setUp(self) -> None:
        self.calls: list[str] = []

        def transport(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
            self.calls.append(url)
            self.assertTrue(url.endswith("/user"))
            self.assertNotIn("google.com", url)
            token = headers["authorization"].removeprefix("Bearer ")
            users = {
                "owner-access-token": google_user("owner@example.com", "google", True, "owner-sub"),
                "other-access-token": google_user("other@example.com", "google", True, "other-sub"),
                "email-access-token": google_user("owner@example.com", "email", True, "email-sub"),
            }
            if token not in users:
                return 401, b"{}"
            return 200, users[token]

        owner = OwnerAuth("https://swadebase.cloud/auth/v1", "owner@example.com", transport)
        self.service = service_for(owner=owner)
        self.headers = operator_headers(self.service, "owner-access-token")

    def test_pending_is_denied_until_owner_approval_and_revoke_denies_again(self) -> None:
        status, issued = self.service.dispatch(
            "POST",
            "/v1/admin/credentials",
            self.headers,
            {},
            {
                "app_id": "maestro-radio",
                "tenant_id": ALPHA,
                "tenant_class": "customer",
                "caller_id": "swadebots.maestro-radio",
                "caller_kind": "swadebots",
                "plan": "free",
                "scopes": ["radio:track", "radio:station", "radio:spin", "radio:artist", "radio:attribution"],
                "owner_email": "other@example.com",
            },
        )
        self.assertEqual(status, 201)
        self.assertEqual(issued["status"], "pending")
        self.assertEqual(issued["owner_email"], "owner@example.com")
        token = issued["token"]
        credential_id = issued["credential_id"]

        status, pending = self.service.dispatch("GET", "/v1/terms", auth(token), {}, None)
        self.assertEqual(status, 403)
        self.assertEqual(pending["error"]["code"], "pending_approval")

        status, approved = self.service.dispatch(
            "POST",
            f"/v1/admin/credentials/{credential_id}/approve",
            self.headers,
            {},
            {},
        )
        self.assertEqual(status, 200)
        self.assertEqual(approved["status"], "approved")
        self.assertEqual(approved["owner_subject"], "owner-sub")
        status, allowed = self.service.dispatch("GET", "/v1/terms", auth(token), {}, None)
        self.assertEqual(status, 200)
        self.assertTrue(allowed["terms"])

        status, revoked = self.service.dispatch(
            "POST",
            f"/v1/admin/credentials/{credential_id}/revoke",
            self.headers,
            {},
            {},
        )
        self.assertEqual(status, 200)
        self.assertEqual(revoked["status"], "revoked")
        status, denied = self.service.dispatch("GET", "/v1/terms", auth(token), {}, None)
        self.assertEqual(status, 403)
        self.assertEqual(denied["error"]["code"], "revoked")

        status, records = self.service.dispatch("GET", "/v1/admin/approvals", self.headers, {}, None)
        self.assertEqual(status, 200)
        self.assertEqual([item["action"] for item in records["approvals"]], ["approve", "revoke"])
        self.assertTrue(all(item["owner_email"] == "owner@example.com" for item in records["approvals"]))

    def test_another_google_account_cannot_approve(self) -> None:
        status, issued = self.service.dispatch(
            "POST",
            "/v1/admin/credentials",
            self.headers,
            {},
            {
                "app_id": "maestro-radio",
                "tenant_id": ALPHA,
                "tenant_class": "customer",
                "caller_id": "swadebots.maestro-radio",
                "caller_kind": "swadebots",
                "plan": "free",
                "scopes": ["radio:track", "radio:station", "radio:spin", "radio:artist", "radio:attribution"],
            },
        )
        self.assertEqual(status, 201)
        status, body = self.service.dispatch(
            "POST",
            "/v1/admin/session",
            {},
            {},
            {"access_token": "other-access-token"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "owner_mismatch")
        status, body = self.service.dispatch(
            "POST",
            "/v1/admin/session",
            {},
            {},
            {"access_token": "email-access-token"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "google_required")

    def test_admin_routes_fail_closed_without_swadebase_auth(self) -> None:
        bare = service_for()
        status, body = bare.dispatch(
            "POST",
            "/v1/admin/session",
            {},
            {},
            {"access_token": "owner-access-token"},
        )
        self.assertEqual(status, 503)
        self.assertEqual(body["error"]["code"], "owner_not_configured")

    def test_disabled_facade_does_not_issue_credentials(self) -> None:
        disabled = service_for(False, owner=self.service.owner)
        self.calls.clear()
        status, body = disabled.dispatch("POST", "/v1/admin/credentials", self.headers, {}, {})
        self.assertEqual(status, 503)
        self.assertEqual(body["error"]["code"], "swade_ontology_disabled")
        self.assertEqual(self.calls, [])


class ManualClock:
    def __init__(self) -> None:
        self.now = 1_000_000.0

    def __call__(self) -> float:
        return self.now


class SessionTests(unittest.TestCase):
    def setUp(self) -> None:
        from swade_ontology.sessions import SessionRegistry

        self.clock = ManualClock()
        self.sessions = SessionRegistry(idle_seconds=100, absolute_seconds=500, reauth_seconds=30, clock=self.clock)

        def transport(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
            token = headers["authorization"].removeprefix("Bearer ")
            if token == "owner-access-token":
                return 200, google_user("owner@example.com", "google", True, "owner-sub")
            return 401, b"{}"

        self.service = service_for(
            owner=OwnerAuth("https://swadebase.cloud/auth/v1", "owner@example.com", transport),
            sessions=self.sessions,
        )

    def test_cookie_is_http_only_and_secret_stays_out_of_the_body(self) -> None:
        cookies: list[str] = []
        status, body = self.service.dispatch(
            "POST",
            "/v1/admin/session",
            {},
            {},
            {"access_token": "owner-access-token"},
            cookies,
        )
        self.assertEqual(status, 200)
        header = cookies[0]
        self.assertIn("HttpOnly", header)
        self.assertIn("Secure", header)
        self.assertIn("SameSite=Lax", header)
        self.assertNotIn("Domain=", header)
        self.assertNotIn("localStorage", json.dumps(body))
        secret = header.split(";", 1)[0].split(".", 1)[1]
        self.assertNotIn(secret, json.dumps(body))

    def test_issuance_and_approval_require_recent_sign_in(self) -> None:
        headers = operator_headers(self.service, "owner-access-token")
        self.clock.now += 31
        status, body = self.service.dispatch(
            "POST",
            "/v1/admin/credentials",
            headers,
            {},
            {
                "app_id": "maestro-radio",
                "tenant_id": ALPHA,
                "tenant_class": "customer",
                "caller_id": "swadebots.maestro-radio",
                "caller_kind": "swadebots",
                "plan": "free",
                "scopes": ["radio:track", "radio:station", "radio:spin", "radio:artist", "radio:attribution"],
            },
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "reauth_required")
        refreshed: list[str] = []
        status, _body = self.service.dispatch(
            "POST",
            "/v1/admin/session",
            headers,
            {},
            {"access_token": "owner-access-token"},
            refreshed,
        )
        self.assertEqual(status, 200)
        fresh = {"cookie": refreshed[-1].split(";", 1)[0]}
        status, issued = self.service.dispatch(
            "POST",
            "/v1/admin/credentials",
            fresh,
            {},
            {
                "app_id": "maestro-radio",
                "tenant_id": ALPHA,
                "tenant_class": "customer",
                "caller_id": "swadebots.maestro-radio",
                "caller_kind": "swadebots",
                "plan": "free",
                "scopes": ["radio:track", "radio:station", "radio:spin", "radio:artist", "radio:attribution"],
            },
        )
        self.assertEqual(status, 201)
        self.assertEqual(issued["status"], "pending")

    def test_idle_session_expires_and_activity_rolls_it_forward(self) -> None:
        headers = operator_headers(self.service, "owner-access-token")
        self.clock.now += 50
        refreshed: list[str] = []
        status, _body = self.service.dispatch("GET", "/v1/admin/session", headers, {}, None, refreshed)
        self.assertEqual(status, 200)
        self.assertIn("Max-Age=100", refreshed[-1])
        self.clock.now += 100
        status, body = self.service.dispatch("GET", "/v1/admin/session", headers, {}, None)
        self.assertEqual(status, 401)
        self.assertEqual(body["error"]["code"], "session_expired")

    def test_absolute_lifetime_ends_even_when_the_session_is_active(self) -> None:
        headers = operator_headers(self.service, "owner-access-token")
        self.clock.now += 50
        self.service.dispatch("GET", "/v1/admin/session", headers, {}, None, [])
        self.clock.now += 460
        status, body = self.service.dispatch("GET", "/v1/admin/session", headers, {}, None)
        self.assertEqual(status, 401)
        self.assertEqual(body["error"]["code"], "session_expired")

    def test_sign_out_revokes_one_device_or_every_device(self) -> None:
        first = operator_headers(self.service, "owner-access-token")
        second = operator_headers(self.service, "owner-access-token")
        cleared: list[str] = []
        status, body = self.service.dispatch("POST", "/v1/admin/session/sign-out", first, {}, {}, cleared)
        self.assertEqual(status, 200)
        self.assertEqual(body["signed_out"], "device")
        self.assertIn("Max-Age=0", cleared[-1])
        status, body = self.service.dispatch("GET", "/v1/admin/session", first, {}, None)
        self.assertEqual(body["error"]["code"], "session_revoked")
        status, body = self.service.dispatch("GET", "/v1/admin/session", second, {}, None)
        self.assertEqual(status, 200)
        status, body = self.service.dispatch("POST", "/v1/admin/session/sign-out-everywhere", second, {}, {})
        self.assertEqual(body["signed_out"], "everywhere")
        status, body = self.service.dispatch("GET", "/v1/admin/session", second, {}, None)
        self.assertEqual(body["error"]["code"], "session_revoked")

    def test_api_credentials_and_human_sessions_do_not_cross(self) -> None:
        grant(self.service.policy, "maestro-alpha-token", "maestro-radio", ALPHA, "customer")
        status, body = self.service.dispatch("POST", "/v1/admin/credentials", auth("maestro-alpha-token"), {}, {})
        self.assertEqual(status, 401)
        self.assertEqual(body["error"]["code"], "unauthenticated")
        headers = operator_headers(self.service, "owner-access-token")
        status, body = self.service.dispatch("GET", "/v1/terms", headers, {}, None)
        self.assertEqual(status, 401)


class LeastPrivilegeTests(unittest.TestCase):
    def test_credential_cannot_read_outside_its_explicit_scopes(self) -> None:
        scoped = service_for()
        credential = scoped.policy.add_credential(
            "narrow-radio-tokenx",
            app_id="maestro-radio",
            tenant_id=ALPHA,
            tenant_class="customer",
            caller_id=CALLER,
            caller_kind="swadebots",
            plan="free",
            scopes=["radio:track", "radio:station", "radio:spin"],
        )
        scoped.policy.approve(credential.credential_id, owner_email="owner@example.com", owner_subject="owner-sub")
        status, body = scoped.dispatch("GET", "/v1/terms", auth("narrow-radio-tokenx"), {}, None)
        self.assertEqual(status, 200)
        self.assertEqual({term["id"] for term in body["terms"]}, {"spin", "station", "track"})
        status, body = scoped.dispatch(
            "POST",
            "/v1/ask",
            auth("narrow-radio-tokenx"),
            {},
            {"question": "how many spins aired"},
        )
        self.assertEqual(status, 200)
        status, denied = scoped.dispatch(
            "POST",
            "/v1/ask",
            auth("narrow-radio-tokenx"),
            {},
            {"question": "which artist performed"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(denied["error"]["code"], "outside_scope")
        self.assertNotIn("artist.name", json.dumps(denied))
        status, body = scoped.dispatch("GET", "/v1/audit", auth("narrow-radio-tokenx"), {}, None)
        self.assertTrue(any(event["outcome"] == "outside_scope" for event in body["events"]))
        with self.assertRaises(ValueError):
            scoped.policy.add_credential(
                "wildcard-radio-token",
                app_id="maestro-radio",
                tenant_id=ALPHA,
                tenant_class="customer",
                caller_id=CALLER,
                caller_kind="swadebots",
                plan="free",
                scopes=["radio:*"],
            )
        with self.assertRaises(ValueError):
            scoped.policy.add_credential(
                "write-radio-tokenxx",
                app_id="maestro-radio",
                tenant_id=ALPHA,
                tenant_class="customer",
                caller_id=CALLER,
                caller_kind="swadebots",
                plan="free",
                scopes=["radio:spin"],
                access="write",
            )
        status, body = scoped.dispatch("DELETE", "/v1/terms/spin", auth("narrow-radio-tokenx"), {}, None)
        self.assertEqual(status, 405)
        self.assertEqual(body["error"]["code"], "read_only")


class ScriptedDatabase:
    def __init__(self, credential: tuple[object, ...], approval: tuple[object, ...]) -> None:
        self.credential = credential
        self.approval = approval
        self.calls: list[tuple[str, tuple[object, ...]]] = []

    def query(self, sql: str, params: tuple[object, ...] = ()) -> list[tuple[object, ...]]:
        self.calls.append((sql, tuple(params)))
        if "to_regclass" in sql:
            return [("swade_ontology.credentials",)]
        if "SELECT credential_id" in sql:
            return [self.credential]
        if "SELECT approval_id" in sql:
            return [self.approval]
        if "document_refs" in sql:
            return [
                ("doc-1", params[0], "Alpha log", "scope-marker"),
                ("doc-2", BRAVO, "Bravo secret", "do not return"),
            ]
        return []


class StoreTests(unittest.TestCase):
    def test_loaded_credential_and_full_text_rows_are_scoped(self) -> None:
        import hashlib

        from swade_ontology.store import IsolatedStore, PostgresDocumentIndex

        token = "loaded-approved-token"
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        database = ScriptedDatabase(
            (
                "cred-1",
                digest,
                "maestro-radio",
                ALPHA,
                "customer",
                CALLER,
                "swadebots",
                "free",
                "approved",
                "artist,attribution,spin,station,track",
                "read",
            ),
            ("approval-1", "cred-1", "approve", "owner@example.com", "owner-sub"),
        )
        store = IsolatedStore(database)
        scoped = service_for(documents=PostgresDocumentIndex(store), store=store)
        store.load_into(scoped.policy)
        status, body = scoped.dispatch("GET", "/v1/terms", auth(token), {}, None)
        self.assertEqual(status, 200)
        self.assertTrue(body["terms"])
        status, body = scoped.dispatch(
            "POST",
            "/v1/documents/search",
            auth(token),
            {},
            {"query": "scope-marker"},
        )
        self.assertEqual(status, 200)
        self.assertEqual([hit["id"] for hit in body["hits"]], ["doc-1"])
        self.assertEqual(body["provenance"]["document_search"], "postgres-fts")
        statement = next(sql for sql, _params in database.calls if "document_refs" in sql)
        self.assertNotIn("scope-marker", statement)

    def test_pending_row_loaded_from_the_database_is_denied(self) -> None:
        import hashlib

        from swade_ontology.store import IsolatedStore

        token = "loaded-pending-tokenx"
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        database = ScriptedDatabase(
            (
                "cred-2",
                digest,
                "maestro-radio",
                ALPHA,
                "customer",
                CALLER,
                "swadebots",
                "free",
                "pending",
                "artist,attribution,spin,station,track",
                "read",
            ),
            ("approval-none", "cred-2", "revoke", "owner@example.com", "owner-sub"),
        )
        store = IsolatedStore(database)
        scoped = service_for(store=store)
        store.load_into(scoped.policy)
        status, body = scoped.dispatch("GET", "/v1/terms", auth(token), {}, None)
        self.assertEqual(status, 403)
        self.assertEqual(body["error"]["code"], "pending_approval")

    def test_null_brain_hits_do_not_crash(self) -> None:
        def transport(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
            return 200, b'{"hits": null}'

        result = BrainClient("http://sss-brain.internal/search", None, transport).search(ALPHA, "note", 5)
        self.assertEqual(result.error, "brain_response_unreadable")
        self.assertEqual(result.hits, [])

    def test_issuance_is_written_to_the_store_without_the_raw_token(self) -> None:
        from swade_ontology.store import IsolatedStore

        database = ScriptedDatabase(
            (
                "cred-3",
                "hash",
                "maestro-radio",
                ALPHA,
                "customer",
                CALLER,
                "swadebots",
                "free",
                "pending",
                "artist,attribution,spin,station,track",
                "read",
            ),
            ("approval-3", "cred-3", "approve", "owner@example.com", "owner-sub"),
        )
        store = IsolatedStore(database)

        def transport(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
            return 200, google_user("owner@example.com", "google", True, "owner-sub")

        scoped = service_for(
            owner=OwnerAuth("https://swadebase.cloud/auth/v1", "owner@example.com", transport),
            store=store,
        )
        status, issued = scoped.dispatch(
            "POST",
            "/v1/admin/credentials",
            operator_headers(scoped, "owner-access-token"),
            {},
            {
                "app_id": "maestro-radio",
                "tenant_id": ALPHA,
                "tenant_class": "customer",
                "caller_id": "swadebots.maestro-radio",
                "caller_kind": "swadebots",
                "plan": "free",
                "scopes": ["radio:track", "radio:station", "radio:spin", "radio:artist", "radio:attribution"],
            },
        )
        self.assertEqual(status, 201)
        insert = next(item for item in database.calls if item[0].startswith("INSERT INTO swade_ontology.credentials"))
        self.assertIn("pending", insert[1])
        self.assertNotIn(issued["token"], insert[0])
        self.assertNotIn(issued["token"], insert[1])

    def test_database_url_without_a_reachable_store_fails_closed(self) -> None:
        from swade_ontology.factory import build_service

        loaded = load_config(
            {
                "SWADE_ONTOLOGY_ENABLED": "true",
                "SWADE_ONTOLOGY_DATABASE_URL": "postgresql://swade_ontology:pw@127.0.0.1:1/swade_ontology",
            }
        )
        built = build_service(loaded)
        self.assertEqual(built.health()["credential_store"], "unavailable")


def google_user(email: str, provider: str, verified: bool, subject: str) -> bytes:
    return json.dumps(
        {
            "email": email,
            "email_confirmed_at": "2026-11-14T00:00:00Z" if verified else None,
            "identities": [
                {
                    "provider": provider,
                    "id": subject,
                    "identity_data": {"email": email, "email_verified": verified, "sub": subject},
                }
            ],
        }
    ).encode()


if __name__ == "__main__":
    unittest.main()
