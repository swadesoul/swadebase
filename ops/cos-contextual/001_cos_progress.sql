BEGIN;
CREATE TABLE IF NOT EXISTS swadesoul.cos_onboarding_progress(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 site_slug text NOT NULL CHECK(site_slug ~ '^[a-z0-9-]{2,60}$'),
 category text NOT NULL DEFAULT 'general' CHECK(category ~ '^[a-z0-9_-]{2,40}$'),
 status text NOT NULL CHECK(status IN ('completed','skipped')),
 completed_at timestamptz NOT NULL DEFAULT now(),
 version int NOT NULL DEFAULT 1 CHECK(version>=1),
 PRIMARY KEY(user_id,site_slug)
);
CREATE INDEX IF NOT EXISTS cos_progress_site_category_idx ON swadesoul.cos_onboarding_progress(site_slug,category);
ALTER TABLE swadesoul.cos_onboarding_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON swadesoul.cos_onboarding_progress FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON swadesoul.cos_onboarding_progress TO service_role;
COMMIT;
