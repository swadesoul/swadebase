BEGIN;
ALTER TABLE swadebase_ops.mcp_clients ADD COLUMN IF NOT EXISTS owner_actor uuid REFERENCES auth.users(id);
ALTER TABLE swadebase_ops.mcp_clients ADD COLUMN IF NOT EXISTS allowed_scopes text[];
ALTER TABLE swadebase_ops.mcp_clients ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
ALTER TABLE swadebase_ops.mcp_clients ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
GRANT UPDATE(enabled,allowed_scopes,updated_at) ON swadebase_ops.mcp_clients TO swadebase_adapters;
COMMIT;
