BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.swade_bots_knowledge(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 bot_id uuid NOT NULL REFERENCES swadebase_ops.swade_bots_profiles(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,
 note text NOT NULL CHECK(length(note) BETWEEN 4 AND 5000),
 source_ref text CHECK(length(source_ref)<=240),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swade_bots_knowledge_owner ON swadebase_ops.swade_bots_knowledge(owner_id,bot_id,created_at DESC);
CREATE TABLE IF NOT EXISTS swadebase_ops.swade_bots_messages(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 bot_id uuid NOT NULL REFERENCES swadebase_ops.swade_bots_profiles(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,
 role text NOT NULL CHECK(role IN ('user','assistant')),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 8000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swade_bots_messages_owner ON swadebase_ops.swade_bots_messages(owner_id,bot_id,id DESC);
REVOKE ALL ON swadebase_ops.swade_bots_knowledge,swadebase_ops.swade_bots_messages FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON swadebase_ops.swade_bots_knowledge TO swadebase_adapters;
GRANT SELECT,INSERT ON swadebase_ops.swade_bots_messages TO swadebase_adapters;
GRANT USAGE,SELECT ON SEQUENCE swadebase_ops.swade_bots_messages_id_seq TO swadebase_adapters;
COMMIT;
