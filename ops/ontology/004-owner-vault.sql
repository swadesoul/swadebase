BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.owner_connection_vault (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 site_slug text NOT NULL CHECK(site_slug ~ '^[a-z0-9][a-z0-9.-]{0,80}$'),
 site_url text NOT NULL CHECK(length(site_url)<=500 AND site_url ~ '^https://[A-Za-z0-9.-]+(/[^[:space:]]*)?$'),
 login_email text NOT NULL CHECK(length(login_email)<=255),
 login_mode text NOT NULL CHECK(login_mode IN ('google','password','other_sso')),
 vault_secret_id uuid,
 access_state text NOT NULL DEFAULT 'owner_only' CHECK(access_state IN ('owner_only','disabled')),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,site_slug),
 CHECK ((login_mode = 'password') OR vault_secret_id IS NULL)
);
CREATE TABLE IF NOT EXISTS swadebase_ops.owner_connection_vault_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 connection_id uuid NOT NULL,
 owner_id uuid NOT NULL,
 event text NOT NULL CHECK(event IN ('created','updated','disabled','secret_updated')),
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON swadebase_ops.owner_connection_vault,swadebase_ops.owner_connection_vault_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON swadebase_ops.owner_connection_vault TO swadebase_adapters;
GRANT SELECT,INSERT ON swadebase_ops.owner_connection_vault_audit TO swadebase_adapters;
GRANT USAGE,SELECT ON SEQUENCE swadebase_ops.owner_connection_vault_audit_id_seq TO swadebase_adapters;
CREATE OR REPLACE FUNCTION swadebase_ops.owner_store_login_secret(_owner uuid,_site text,_value text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
 DECLARE _id uuid;
 BEGIN
  IF _owner IS NULL OR _site !~ '^[a-z0-9][a-z0-9.-]{0,80}$'
     OR _value IS NULL OR length(_value)<8 OR length(_value)>2048 THEN
    RAISE EXCEPTION 'invalid_secret_input';
  END IF;
  _id := public.sssbrain_store_secret(_value,
    'swadebase:owner-login:'||_owner::text||':'||_site||':'||gen_random_uuid()::text,
    '{"purpose":"owner_login_connection","access":"owner_only"}');
  RETURN _id;
 END $fn$;
REVOKE ALL ON FUNCTION swadebase_ops.owner_store_login_secret(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION swadebase_ops.owner_store_login_secret(uuid,text,text) TO swadebase_adapters;
COMMIT;
