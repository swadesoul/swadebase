-- Isolated SWADE ontology database.
-- Target database name: swade_ontology.
-- Do not run this against the SWADEBASE platform database.
-- This repository rehearses the script inside BEGIN ... ROLLBACK.
-- Applying it is a separate operator step and is not done here.
-- Document search uses Postgres full-text search. Do not add a vector extension here.

CREATE SCHEMA IF NOT EXISTS swade_ontology;

CREATE TABLE IF NOT EXISTS swade_ontology.credentials (
  credential_id text NOT NULL UNIQUE,
  token_hash text PRIMARY KEY,
  app_id text NOT NULL,
  tenant_id text NOT NULL,
  tenant_class text NOT NULL CHECK (tenant_class IN ('customer', 'personal')),
  caller_id text NOT NULL,
  caller_kind text NOT NULL CHECK (caller_kind IN ('swadebots', 'app')),
  plan text NOT NULL CHECK (plan IN ('free', 'paid')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  scopes text NOT NULL,
  access text NOT NULL DEFAULT 'read' CHECK (access = 'read'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scopes <> '' AND position('*' in scopes) = 0),
  CHECK (
    (tenant_class = 'personal' AND tenant_id = 'swade-personal')
    OR (tenant_class = 'customer' AND tenant_id <> 'swade-personal')
  )
);

CREATE TABLE IF NOT EXISTS swade_ontology.approvals (
  approval_id text PRIMARY KEY,
  credential_id text NOT NULL REFERENCES swade_ontology.credentials (credential_id),
  action text NOT NULL CHECK (action IN ('approve', 'revoke')),
  owner_email text NOT NULL,
  owner_subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swade_ontology.admin_sessions (
  session_id text PRIMARY KEY,
  secret_hash text NOT NULL,
  owner_email text NOT NULL,
  owner_subject text NOT NULL,
  created_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  authenticated_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false
);

-- Append-only. Insert rows. Do not update or delete them.
CREATE TABLE IF NOT EXISTS swade_ontology.audit_events (
  id bigserial PRIMARY KEY,
  decision_id text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  app_id text,
  tenant_id text,
  tenant_class text,
  credential_id text,
  caller_id text,
  task_id text,
  terms text,
  source_tables text,
  action text NOT NULL,
  outcome text NOT NULL
);

CREATE TABLE IF NOT EXISTS swade_ontology.document_refs (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  search tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS document_refs_search_idx
  ON swade_ontology.document_refs USING gin (search);

CREATE INDEX IF NOT EXISTS document_refs_tenant_idx
  ON swade_ontology.document_refs (tenant_id);
