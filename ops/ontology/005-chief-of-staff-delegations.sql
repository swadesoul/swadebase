BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.swade_bots_delegations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 bot_id uuid NOT NULL REFERENCES swadebase_ops.swade_bots_profiles(id) ON DELETE RESTRICT,
 site_slug text NOT NULL CHECK(site_slug ~ '^[a-z0-9][a-z0-9.-]{0,80}$'),
 scope text NOT NULL DEFAULT 'reference_read' CHECK(scope IN ('reference_read','browser_proposal')),
 state text NOT NULL DEFAULT 'proposed' CHECK(state IN ('proposed','approved','revoked')),
 source text NOT NULL DEFAULT 'chief_of_staff',
 purpose text NOT NULL CHECK(length(purpose) BETWEEN 5 AND 500),
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '1 day'),
 created_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz,
 revoked_at timestamptz,
 UNIQUE(owner_id,bot_id,site_slug,scope),
 CHECK(state <> 'approved' OR approved_at IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS swadebase_ops.swade_bots_delegation_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 delegation_id uuid NOT NULL REFERENCES swadebase_ops.swade_bots_delegations(id),
 actor_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN ('proposed','approved','revoked')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swade_bots_delegations_lookup ON swadebase_ops.swade_bots_delegations(owner_id,bot_id,site_slug,state,expires_at);
REVOKE ALL ON swadebase_ops.swade_bots_delegations,swadebase_ops.swade_bots_delegation_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON swadebase_ops.swade_bots_delegations TO swadebase_adapters;
GRANT SELECT,INSERT ON swadebase_ops.swade_bots_delegation_events TO swadebase_adapters;
GRANT USAGE,SELECT ON SEQUENCE swadebase_ops.swade_bots_delegation_events_id_seq TO swadebase_adapters;
COMMIT;