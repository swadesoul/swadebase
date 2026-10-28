BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.mcp_clients (
 id text PRIMARY KEY, name text NOT NULL, redirect_uris jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS swadebase_ops.mcp_pending (
 id uuid PRIMARY KEY,client_id text NOT NULL REFERENCES swadebase_ops.mcp_clients(id),
 redirect_uri text NOT NULL,state text NOT NULL,challenge text NOT NULL,scopes text[] NOT NULL,
 resource text NOT NULL,expires_at timestamptz NOT NULL,consumed_at timestamptz
);
CREATE TABLE IF NOT EXISTS swadebase_ops.mcp_codes (
 code_hash text PRIMARY KEY,client_id text NOT NULL,actor_id uuid NOT NULL,redirect_uri text NOT NULL,
 challenge text NOT NULL,scopes text[] NOT NULL,resource text NOT NULL,
 expires_at timestamptz NOT NULL,consumed_at timestamptz
);
CREATE TABLE IF NOT EXISTS swadebase_ops.mcp_tokens (
 token_hash text PRIMARY KEY,client_id text NOT NULL,actor_id uuid NOT NULL,
 scopes text[] NOT NULL,issuer text NOT NULL,audience text NOT NULL,
 expires_at timestamptz NOT NULL,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT ON swadebase_ops.mcp_clients TO swadebase_adapters;
GRANT SELECT,INSERT,UPDATE ON swadebase_ops.mcp_pending,swadebase_ops.mcp_codes,swadebase_ops.mcp_tokens TO swadebase_adapters;
GRANT USAGE ON SCHEMA sssbrain TO swadebase_adapters;
GRANT SELECT ON sssbrain.swadebase_docs,sssbrain.swadebase_knowledge_chunks TO swadebase_adapters;
CREATE UNIQUE INDEX IF NOT EXISTS mcp_handoff_idempotency ON swadebase_ops.handoff_log
 ((meta->>'actor_id'),(meta->>'idempotency_key')) WHERE source='swadebase-mcp';
-- Existing knowledge tables use RLS; grant only the approved references needed here.
DROP POLICY IF EXISTS swadebase_mcp_reference_read ON sssbrain.swadebase_docs;
CREATE POLICY swadebase_mcp_reference_read ON sssbrain.swadebase_docs FOR SELECT TO swadebase_adapters
 USING (doc_path LIKE 'site-bibles/%' OR doc_path='STANDING_RULES.md');
DROP POLICY IF EXISTS swadebase_mcp_reference_read ON sssbrain.swadebase_knowledge_chunks;
CREATE POLICY swadebase_mcp_reference_read ON sssbrain.swadebase_knowledge_chunks FOR SELECT TO swadebase_adapters
 USING (doc_path LIKE 'site-bibles/%' OR doc_path='STANDING_RULES.md');
COMMIT;

