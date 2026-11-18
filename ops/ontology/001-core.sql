BEGIN;
CREATE TABLE IF NOT EXISTS swadebase_ops.ontology_entities (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 entity_type text NOT NULL CHECK (entity_type IN ('platform','service','site','adapter','document')),
 source_key text NOT NULL,
 display_name text NOT NULL,
 source_system text NOT NULL,
 source_version text,
 status text NOT NULL DEFAULT 'observed' CHECK (status IN ('observed','verified','proposed','retired')),
 evidence_state text NOT NULL DEFAULT 'source_record',
 properties jsonb NOT NULL DEFAULT '{}'::jsonb,
 observed_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (entity_type,source_key)
);
CREATE TABLE IF NOT EXISTS swadebase_ops.ontology_edges (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 from_id bigint NOT NULL REFERENCES swadebase_ops.ontology_entities(id) ON DELETE RESTRICT,
 to_id bigint NOT NULL REFERENCES swadebase_ops.ontology_entities(id) ON DELETE RESTRICT,
 predicate text NOT NULL CHECK (predicate IN ('belongs_to','documented_by','offered_through','managed_by')),
 source_system text NOT NULL,
 evidence_state text NOT NULL DEFAULT 'source_record',
 observed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (from_id,to_id,predicate,source_system),
 CHECK (from_id <> to_id)
);
CREATE INDEX IF NOT EXISTS ontology_entity_source ON swadebase_ops.ontology_entities(source_system,status);
CREATE INDEX IF NOT EXISTS ontology_edge_from ON swadebase_ops.ontology_edges(from_id);
CREATE INDEX IF NOT EXISTS ontology_edge_to ON swadebase_ops.ontology_edges(to_id);
REVOKE ALL ON swadebase_ops.ontology_entities,swadebase_ops.ontology_edges FROM PUBLIC,anon,authenticated;
GRANT SELECT ON swadebase_ops.ontology_entities,swadebase_ops.ontology_edges TO swadebase_adapters;
INSERT INTO swadebase_ops.ontology_entities(entity_type,source_key,display_name,source_system,status,evidence_state,properties)
 VALUES('platform','swadebase','SWADEBASE','approved_owner_policy','verified','approved_reference','{"scope":"shared"}'::jsonb),
 ('service','swade-bots','SWADE BOTS','approved_owner_policy','verified','approved_reference','{"legacy_alias":"Rakaza","technical_identifiers_preserved":true}'::jsonb)
 ON CONFLICT(entity_type,source_key) DO UPDATE SET display_name=excluded.display_name,properties=excluded.properties,updated_at=now();
INSERT INTO swadebase_ops.ontology_edges(from_id,to_id,predicate,source_system,evidence_state)
 SELECT a.id,b.id,'managed_by','approved_owner_policy','approved_reference'
 FROM swadebase_ops.ontology_entities a CROSS JOIN swadebase_ops.ontology_entities b
 WHERE a.entity_type='service' AND a.source_key='swade-bots' AND b.entity_type='platform' AND b.source_key='swadebase'
 ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION swadebase_ops.ontology_sync_adapter() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
 BEGIN
  INSERT INTO swadebase_ops.ontology_entities(entity_type,source_key,display_name,source_system,source_version,status,evidence_state,properties,observed_at,updated_at)
  VALUES('adapter',NEW.id,NEW.display_name,'swadebase_ops.adapters_registry',NEW.updated_at::text,
    CASE WHEN NEW.status='retired' THEN 'retired' WHEN NEW.enabled THEN 'observed' ELSE 'proposed' END,
    'registry_record',jsonb_build_object('enabled',NEW.enabled,'kind',NEW.kind,'owner_site',NEW.owner_site),now(),now())
  ON CONFLICT(entity_type,source_key) DO UPDATE SET display_name=excluded.display_name,source_version=excluded.source_version,status=excluded.status,properties=excluded.properties,updated_at=now();
  RETURN NEW;
 END $fn$;
CREATE OR REPLACE FUNCTION swadebase_ops.ontology_sync_doc() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
 BEGIN
  IF NEW.doc_path='STANDING_RULES.md' OR NEW.doc_path LIKE 'site-bibles/%.md' THEN
   INSERT INTO swadebase_ops.ontology_entities(entity_type,source_key,display_name,source_system,source_version,status,evidence_state,properties,observed_at,updated_at)
   VALUES('document',NEW.doc_path,NEW.title,'sssbrain.swadebase_docs',NEW.doc_sha,'observed','approved_reference',jsonb_build_object('doc_path',NEW.doc_path),now(),now())
   ON CONFLICT(entity_type,source_key) DO UPDATE SET display_name=excluded.display_name,source_version=excluded.source_version,updated_at=now();
  END IF;
  RETURN NEW;
 END $fn$;
DROP TRIGGER IF EXISTS ontology_adapter_registry_sync ON swadebase_ops.adapters_registry;
CREATE TRIGGER ontology_adapter_registry_sync AFTER INSERT OR UPDATE OF display_name,enabled,status,updated_at ON swadebase_ops.adapters_registry
 FOR EACH ROW EXECUTE FUNCTION swadebase_ops.ontology_sync_adapter();
DROP TRIGGER IF EXISTS ontology_doc_sync ON sssbrain.swadebase_docs;
CREATE TRIGGER ontology_doc_sync AFTER INSERT OR UPDATE OF doc_sha,title ON sssbrain.swadebase_docs
 FOR EACH ROW EXECUTE FUNCTION swadebase_ops.ontology_sync_doc();
INSERT INTO swadebase_ops.ontology_entities(entity_type,source_key,display_name,source_system,source_version,status,evidence_state,properties)
 SELECT 'adapter',id,display_name,'swadebase_ops.adapters_registry',updated_at::text,
 CASE WHEN status='retired' THEN 'retired' WHEN enabled THEN 'observed' ELSE 'proposed' END,
 'registry_record',jsonb_build_object('enabled',enabled,'kind',kind,'owner_site',owner_site)
 FROM swadebase_ops.adapters_registry
 ON CONFLICT(entity_type,source_key) DO UPDATE SET display_name=excluded.display_name,status=excluded.status,source_version=excluded.source_version,properties=excluded.properties,updated_at=now();
INSERT INTO swadebase_ops.ontology_entities(entity_type,source_key,display_name,source_system,source_version,status,evidence_state,properties)
 SELECT 'document',doc_path,title,'sssbrain.swadebase_docs',doc_sha,'observed','approved_reference',jsonb_build_object('doc_path',doc_path)
 FROM sssbrain.swadebase_docs WHERE doc_path='STANDING_RULES.md' OR doc_path LIKE 'site-bibles/%.md'
 ON CONFLICT(entity_type,source_key) DO UPDATE SET display_name=excluded.display_name,source_version=excluded.source_version,updated_at=now();
INSERT INTO swadebase_ops.ontology_edges(from_id,to_id,predicate,source_system,evidence_state)
 SELECT a.id,b.id,'belongs_to','swadebase_ops.adapters_registry','registry_record'
 FROM swadebase_ops.ontology_entities a, swadebase_ops.ontology_entities b
 WHERE a.entity_type='adapter' AND b.entity_type='platform' AND b.source_key='swadebase'
 ON CONFLICT DO NOTHING;
COMMIT;
