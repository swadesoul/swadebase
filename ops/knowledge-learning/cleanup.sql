BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SELECT pg_advisory_xact_lock(hashtext('founder-knowledge-cleanup-v1'));
CREATE TEMP TABLE knowledge_duplicate_map ON COMMIT DROP AS
SELECT id AS removed_id,canonical_id FROM (
 SELECT id,first_value(id) OVER w canonical_id,row_number() OVER w n
 FROM sssbrain.knowledge_entries
 WHERE user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979'
 WINDOW w AS (PARTITION BY user_id,title,content,summary,source_type,source_url,category,node_id,tags ORDER BY (embedding IS NOT NULL) DESC,created_at,id)
) r WHERE n>1;
UPDATE sssbrain.client_doc_email_log e SET knowledge_entry_id=m.canonical_id
FROM knowledge_duplicate_map m WHERE e.knowledge_entry_id=m.removed_id AND e.user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979';
DELETE FROM sssbrain.knowledge_entries k USING knowledge_duplicate_map m
WHERE k.id=m.removed_id AND k.user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979';
ALTER TABLE sssbrain.brain_wiki_pages ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active';
UPDATE sssbrain.brain_wiki_pages SET lifecycle_status='active',confidence_status='unverified',updated_at=now()
WHERE user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979' AND confidence_status='draft';
INSERT INTO swadebase_ops.handoff_log(kind,source,target_agent,title,body,meta,status,needs_approval)
VALUES('note','knowledge-learning','cos','Founder knowledge cleanup and wiki activation','Exact duplicate records consolidated with canonical IDs and email references preserved. Existing wiki drafts are active references with unverified confidence; no claims promoted to verified.',jsonb_build_object('actor_id','f6e059a4-ea87-46ac-9b8e-cda2b047b979','duplicate_map',(SELECT coalesce(jsonb_agg(to_jsonb(m)),'[]') FROM knowledge_duplicate_map m),'migration','knowledge-learning-v1'),'done',false);
SELECT json_build_object('duplicates_removed',(SELECT count(*) FROM knowledge_duplicate_map),'knowledge_remaining',(SELECT count(*) FROM sssbrain.knowledge_entries WHERE user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979'),'wiki_active',(SELECT count(*) FROM sssbrain.brain_wiki_pages WHERE user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979' AND lifecycle_status='active'),'wiki_drafts',(SELECT count(*) FROM sssbrain.brain_wiki_pages WHERE user_id='f6e059a4-ea87-46ac-9b8e-cda2b047b979' AND confidence_status='draft'));
COMMIT;
