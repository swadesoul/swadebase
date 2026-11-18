BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.whats_new_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 site text NOT NULL CHECK(length(site) BETWEEN 1 AND 100),
 process text NOT NULL CHECK(length(process) BETWEEN 1 AND 160),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 240),
 description text NOT NULL CHECK(length(description) BETWEEN 3 AND 5000),
 release_state text NOT NULL CHECK(release_state IN ('planned','internal','shipped')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS swadebase_ops.press_release_deliveries (
 id uuid PRIMARY KEY,
 draft_id bigint NOT NULL REFERENCES swadebase_ops.advisor_press_drafts(id),
 recipient text NOT NULL,
 content_digest text NOT NULL,
 status text NOT NULL CHECK(status IN ('pending','accepted','rejected','unknown')),
 provider_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(draft_id,recipient,content_digest)
);
GRANT SELECT,INSERT ON swadebase_ops.whats_new_events TO swadebase_adapters;
GRANT SELECT,INSERT,UPDATE ON swadebase_ops.press_release_deliveries TO swadebase_adapters;
COMMIT;
