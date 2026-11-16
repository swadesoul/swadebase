# OATHLOOM × Impeccable design rules (2026-11-16)

**What changed (live on swadesoul):** `docker/volumes/functions/oathloom-build/`. Note that functions are git-ignored, so this doc is the record.

- New `impeccable-rules.ts`: condensed, pinned excerpts of Impeccable (github.com/pbakaus/impeccable @ d41d986, v4.9.2, Apache-2.0, modified). It exports `IMPECCABLE_DIRECTOR`, `IMPECCABLE_CRAFT_FLOOR`, `IMPECCABLE_REVIEW` and `IMPECCABLE_REPAIR`.
- `index.ts`:
  - **Design DNA:** new `mode`, `scene` and `colorStrategy` fields. The motion field is now "one authored signature moment".
  - **Blueprint (Design DNA Director):** gets `IMPECCABLE_DIRECTOR`.
  - **Code Weaver:** the old rules that conflicted with Impeccable are replaced: "layered depth (gradients, glows…)", "reveal-on-scroll" on every section, and "gradient compositions" as imagery. It also gets `IMPECCABLE_CRAFT_FLOOR`.
  - **Quality Verifier:** gets `IMPECCABLE_REVIEW`, with severities.
  - **Repair Weaver:** gets `IMPECCABLE_REPAIR`.
- `design-policy.ts`: `DESIGN_POLICY_VERSION` is now `2026-11-16.1-impeccable`.
- **Backup of the previous version:** `/opt/swadebase/backups/oathloom-build-20261116T170656Z/`. To roll back, copy it over the folder. No restart is needed, because workers load the code per request.
- **Verified:** the function boots (OPTIONS 200, an unauthenticated POST gets 401). A real build needs a signed-in Studio session and has not been run yet.

**Not adopted:** Impeccable live mode. It runs an agent with approvals off and is meant only for local checkouts.

**Next (phase 1b and 2):** run the deterministic detector (`impeccable detect --json`, 62 rules, no LLM) before the LLM review. Then add a rendered-page check in the media worker, and section buttons in OATHLOOM (Bolder, Quieter, Polish, Simplify, Color, Type, Motion).
