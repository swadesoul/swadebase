BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.veteran_bridge_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 bridge_id text NOT NULL UNIQUE DEFAULT ('VB-' || gen_random_uuid()::text),
 plan jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(plan)='array'),
 plan_version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS swadebase_ops.veteran_bridge_usage (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 usage_date date NOT NULL DEFAULT current_date,
 requests integer NOT NULL DEFAULT 0,
 PRIMARY KEY (user_id,usage_date)
);
ALTER TABLE swadebase_ops.veteran_bridge_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swadebase_ops.veteran_bridge_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON swadebase_ops.veteran_bridge_profiles,swadebase_ops.veteran_bridge_usage FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON swadebase_ops.veteran_bridge_profiles,swadebase_ops.veteran_bridge_usage TO swadebase_adapters;
DROP POLICY IF EXISTS bridge_backend_only ON swadebase_ops.veteran_bridge_profiles;
CREATE POLICY bridge_backend_only ON swadebase_ops.veteran_bridge_profiles TO swadebase_adapters USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS bridge_backend_only ON swadebase_ops.veteran_bridge_usage;
CREATE POLICY bridge_backend_only ON swadebase_ops.veteran_bridge_usage TO swadebase_adapters USING (true) WITH CHECK (true);
INSERT INTO swadebase_ops.adapters_registry (id,display_name,kind,what_it_is,purpose,connections,owner_site,status,evidence,enforcing,enforcement_note)
VALUES ('veteran-bridge','Swade Veteran Bridge','site_adapter','Authenticated veteran navigation using shared local AI and SWADEBASE identity','General navigation, account IDs, generic plan sync; no VA record access or claims submission', '{"auth":"SWADEBASE GoTrue","ai":"Ollama llama3.2:3b","paid_fallback":false,"va_connected":false}'::jsonb,'https://veteran-bridge.swadeswade-s-8788.chatgpt.site','live',ARRAY['Authenticated API and local-AI integration verification required before public delivery'],true,'Every write and AI call checks registry enabled; local-only inference, no paid fallback.')
ON CONFLICT (id) DO NOTHING;
COMMIT;
