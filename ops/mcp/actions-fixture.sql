CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111','swadesoul@gmail.com',now()),('22222222-2222-4222-8222-222222222222','other@example.test',now());
-- Synthetic fixtures only. Apply in a disposable database, never the application database.
CREATE SCHEMA sssbrain;
CREATE SCHEMA swadebase_ops;
CREATE FUNCTION swadebase_ops.is_super_admin(uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
CREATE TABLE sssbrain.ops_actions(id uuid PRIMARY KEY,actor uuid NOT NULL,app_slug text NOT NULL,action text NOT NULL,risk text CHECK(risk IN ('read','write')),status text CHECK(status IN ('recorded','awaiting_approval','approved','executed','rejected','failed')),target text,confirmation_phrase text,request jsonb NOT NULL,result jsonb,receipt jsonb,approved_by uuid,approved_at timestamptz,executed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE sssbrain.brain_wiki_pages(id uuid PRIMARY KEY,user_id uuid NOT NULL,title text,body_markdown text,updated_at timestamptz NOT NULL DEFAULT now(),lifecycle_status text);
INSERT INTO sssbrain.brain_wiki_pages(id,user_id,title,body_markdown,lifecycle_status) VALUES('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','Owned fixture draft','Synthetic recoverable content','draft'),('55555555-5555-4555-8555-555555555555','22222222-2222-4222-8222-222222222222','Other fixture draft','Other synthetic content','draft');
CREATE TABLE swadebase_ops.advisor_events(action text,target text,detail jsonb);
CREATE TABLE swadebase_ops.adapters_registry(id text PRIMARY KEY,enabled boolean,status text);
INSERT INTO swadebase_ops.adapters_registry VALUES('swadebase-mcp',true,'live');
ALTER TABLE sssbrain.ops_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sssbrain.brain_wiki_pages ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA swadebase_ops TO swadebase_adapters;
GRANT INSERT ON swadebase_ops.advisor_events TO swadebase_adapters;
GRANT SELECT ON swadebase_ops.adapters_registry TO swadebase_adapters;
