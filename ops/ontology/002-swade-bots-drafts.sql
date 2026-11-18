BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.swade_bots_profiles(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 2 AND 100),
 bot_role text NOT NULL CHECK(length(bot_role) BETWEEN 2 AND 160),
 site_slug text NOT NULL CHECK(site_slug ~ '^[a-z0-9][a-z0-9.-]{0,80}$'),
 instructions text NOT NULL DEFAULT '' CHECK(length(instructions)<=5000),
 provider text NOT NULL DEFAULT 'local' CHECK(provider IN ('local','together','replicate','kie','qwen-cloud','other')),
 voice_enabled boolean NOT NULL DEFAULT false,
 allowed_tools text[] NOT NULL DEFAULT '{}',
 monthly_budget_cents integer NOT NULL DEFAULT 0 CHECK(monthly_budget_cents BETWEEN 0 AND 10000000),
 state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','paused')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS swadebase_ops.swade_bots_profile_audit(
 id bigserial PRIMARY KEY,
 bot_id uuid NOT NULL,
 actor_id uuid NOT NULL,
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON swadebase_ops.swade_bots_profiles,swadebase_ops.swade_bots_profile_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON swadebase_ops.swade_bots_profiles TO swadebase_adapters;
GRANT SELECT,INSERT ON swadebase_ops.swade_bots_profile_audit TO swadebase_adapters;
GRANT USAGE,SELECT ON SEQUENCE swadebase_ops.swade_bots_profile_audit_id_seq TO swadebase_adapters;
COMMIT;