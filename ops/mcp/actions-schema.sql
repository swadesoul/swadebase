BEGIN;
DO $$ BEGIN IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='sssbrain.ops_actions'::regclass) OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='sssbrain.brain_wiki_pages'::regclass) THEN RAISE EXCEPTION 'Required actor tables must have RLS enabled'; END IF; END $$;
-- Reuse the existing action/receipt store; preserve legacy app/action contracts.
CREATE OR REPLACE FUNCTION swadebase_ops.mcp_is_owner(uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=uid AND lower(u.email)='swadesoul@gmail.com' AND u.email_confirmed_at IS NOT NULL) AND swadebase_ops.is_super_admin(uid) $$;
REVOKE ALL ON FUNCTION swadebase_ops.mcp_is_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swadebase_ops.mcp_is_owner(uuid) TO swadebase_adapters;
GRANT USAGE ON SCHEMA sssbrain TO swadebase_adapters;
GRANT SELECT,INSERT,UPDATE ON sssbrain.ops_actions TO swadebase_adapters;
DROP POLICY IF EXISTS mcp_actor_actions ON sssbrain.ops_actions;
CREATE POLICY mcp_actor_actions ON sssbrain.ops_actions FOR ALL TO swadebase_adapters
 USING (app_slug='mcp_execution' AND request->>'source'='swadebase-mcp-actions' AND actor::text=current_setting('swade.mcp.actor',true))
 WITH CHECK (app_slug='mcp_execution' AND request->>'source'='swadebase-mcp-actions' AND actor::text=current_setting('swade.mcp.actor',true));
CREATE UNIQUE INDEX IF NOT EXISTS mcp_action_idempotency ON sssbrain.ops_actions(actor,(request->>'idempotency_key'))
 WHERE app_slug='mcp_execution' AND request->>'source'='swadebase-mcp-actions' AND request ? 'idempotency_key';
CREATE UNIQUE INDEX IF NOT EXISTS mcp_payment_reference ON sssbrain.ops_actions(actor,(request->'snapshot'->'input'->>'destination'),(request->'snapshot'->'input'->>'reference')) WHERE app_slug='mcp_execution' AND action='mcp_payment_transfer' AND result->>'stage' IN ('awaiting_approval','approved','executing','unknown','transferred');
GRANT SELECT(id,user_id,title,body_markdown,updated_at,lifecycle_status) ON sssbrain.brain_wiki_pages TO swadebase_adapters;
GRANT UPDATE(lifecycle_status,updated_at) ON sssbrain.brain_wiki_pages TO swadebase_adapters;
DROP POLICY IF EXISTS mcp_owned_draft_read ON sssbrain.brain_wiki_pages;
CREATE POLICY mcp_owned_draft_read ON sssbrain.brain_wiki_pages FOR SELECT TO swadebase_adapters
 USING (user_id::text=current_setting('swade.mcp.actor',true));
DROP POLICY IF EXISTS mcp_owned_draft_archive ON sssbrain.brain_wiki_pages;
CREATE POLICY mcp_owned_draft_archive ON sssbrain.brain_wiki_pages FOR UPDATE TO swadebase_adapters
 USING (user_id::text=current_setting('swade.mcp.actor',true))
 WITH CHECK (user_id::text=current_setting('swade.mcp.actor',true));
COMMIT;
