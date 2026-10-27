# SWADEBASE knowledge learning — first operational phase

Owner-approved October 26, 2026 America/Chicago. This phase improves retrieval; it does not retrain model weights.

## Existing components reused
Existing SWADEBASE PostgreSQL knowledge tables, Incident Guardian hourly timer, shared adapter/MCP process, owner console, local Ollama Llama 3.2 3B and current identity checks. No paid inference/embeddings, new database, duplicate scheduler or customer training ingestion.

## Delivered behavior
Founder knowledge was backed up privately on the existing host before cleanup. Exact duplicates were consolidated using all material source fields and preserving canonical IDs and any email references. 84 records became 16; audit maps retain the 68 removed IDs. No unique content was discarded. 14 wiki pages have lifecycle_status active; 11 former drafts have unverified confidence, while the two verified pages and authoritative persona retain their original confidence. Active does not mean independently verified.

Approved reference files under docs/site-bibles, STANDING_RULES.md and docs/learning-approved are incrementally parsed into existing swadebase_docs/swadebase_knowledge_chunks. Content hashes avoid reprocessing unchanged files. Full-text search is used; embeddings are not required. The existing sssbrain-incident-guardian service invokes the sync after its existing review. Its existing hourly timer remains the scheduler. Private user uploads are not read by this file collector. Exclude credentials from approved reference files; detected key material quarantines the indexed file, but pattern scanning is not a guarantee of anonymization.

The existing private owner page /adapters/mcp-connect includes Ask your knowledge. The shared endpoint /adapters/mcp/knowledge and MCP swade_ask_knowledge retrieve current references and the verified actor's private records. Shared approved references and private sources are labeled separately. Server-side identity and scope checks precede access. The database has restrictive owner-read policies for private records; each read transaction sets the verified actor and releases it on commit/rollback.

Local answers are bounded to one active inference, ten attempts/hour/actor, a 60-second timeout, 350 generated tokens and 4096 context. Source context is limited to 6000 characters. Output labels must refer to supplied sources; invalid labels or model errors return exact source extracts. Valid citation labels are not proof that every generated statement is supported. Unknown topics return insufficient_evidence. No actions are executed and no paid fallback occurs. Knowledge is untrusted reference material, not authorization or system instructions.

## Sources and later expansion
User-requested source inventory: VideoSayWhat, ReSingLab, My Distribution (mydistribution.music), Your Own Distribution (canonical project unresolved), SwadeSoul.com, BlackTales.online, Swoney, TheMaestroRadio.com, Sovereign Board, GroundLift, SwadeSpace and Attobahn. Registry aliases for Maestro and several project domains are stale or conflicting; verify current deployment before enabling connectors. This list is a roadmap, not twelve live collectors.

All owned skills and site code are intended reference inputs after verified repository mapping. Do not treat a registered skill as a working tool or executable authority. This release does not claim every skill/repository is indexed. No GitHub webhook collector was deployed here.

User contributions: personal workspace memory, shared sanitized learning and model-training consent must remain separate. Collection/training is off until granular opt-in, item/project exclusions, provenance, sanitization/quarantine, revocation, dataset snapshots and held-out evaluation are implemented. Personal information, customer code and secrets must not be placed in shared training. Owned repository code is a distinct authorized reference stream. Withdrawal cannot promise erasure from existing trained weights.

## SSS Knowledge Studio discovery
Existing NotebookLM-style project: https://github.com/swadesoul/sssbrain/pull/26 ; branch feature/sss-knowledge-studio, head d6d8d1bdb35bd5b86f404e4c003236defd17bf1c. Open/unmerged when inspected. Source provides selected-source Q&A, briefings, reports, quizzes, text mind maps, podcast scripts, video briefs and save-to-knowledge. It is not verified live. Three existing review defects require repair: upload/source-list mismatch, saved output provenance using changed UI selection, and truncated fallback citations lacking source metadata. Reuse this project for the document studio rather than building a second system. The first-phase Ask your knowledge endpoint is a bounded operator retrieval entry point, not a substitute claim that the full studio shipped.

## Checks and rollback
Run ops/mcp knowledge unit tests, existing protocol/merch regression tests and knowledge-live-smoke.mjs. Live smoke uses temporary owner sessions, tests no-auth/origin/CSRF/secret rejection, approved/private retrieval, unknown evidence and local inference, then deletes its sessions. Independently verify private-row isolation and a changed-source incremental sync. Check source counts, unique-content count, wiki statuses, current indexed Bible hash and Guardian post-run status.

Backups: /opt/swadebase/backups/knowledge-learning-20261027T042144Z (private; do not publish contents). Preserve current unrelated edits. Roll back only this release's MCP files and remove the knowledge-index systemd drop-in, then reload systemd and restart only adapters. Revert policies with reviewed SQL; no schema/table drops or user data deletion. Cleanup recovery uses the private founder snapshot and canonical mapping, restoring only missing original IDs and prior wiki state. Retain audit history. Former draft confidence may be restored independently of lifecycle availability.

## Status
Cleaned owner data and deployed shared retrieval code; verification results are recorded in the release evidence and Site Bible checkpoint. Native SSS Brain and Brainiak conversational wiring, complete Knowledge Studio deployment, all-site GitHub collection and general user-consent UI remain follow-up work. No LLM fine-tuning occurred.


### Knowledge release KL-1 — final verification
First live unconstrained synthesis rejected its citation output and correctly returned source extracts. Constrained source-label JSON generation then passed a second public HTTPS live request: Llama correctly explained the recorded Brainiak HTTP 413 cause and bounded route fix, citing the approved lesson. All 32 MCP/protocol/merch/knowledge tests passed. Official SDK live HTTPS discovery found nine tools and invoked source-grounded extract retrieval and Knowledge Studio search. Independent cleanup comparison preserved every unique material source field; email reference-orphan count zero. Owner isolation passed on the actual adapter database role. Changed-source indexing updated exactly the three changed Bibles; unchanged refresh updated zero. Owner UI/API are deployed; authenticated browser/mobile visual testing is not certified.
