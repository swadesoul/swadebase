# SWADEBASE HyperFrames Adapter — TeachVirt-first handoff (2026-10-23)

## Installed and verified
- Service: swadebase-hyperframes.service on swadesoul SWADEBASE primary.
- Private API: http://127.0.0.1:18787 (never expose directly to browsers).
- Engine: HeyGen HyperFrames 0.8.156 copied from existing SSS Brain kit.
- Consumer registry: teachvirt, sssbrain. Starter template only for now.
- Environment token: /opt/swadebase/hyperframes-adapter/token.env (root-only; never paste in chat).
- POST /v1/renders { "site":"teachvirt", "template":"starter" } authenticated with Bearer token.
- GET /v1/jobs/{id} authenticated; GET /health unauthenticated.
- Render artifacts: /opt/swadebase/hyperframes-adapter/jobs/ on local host only.
- Node 22 via /root/.nvm/versions/node/v22.23.3/bin/node.
- No Lovable credits used. No live TeachVirt frontend edits or external API exposure.

## TeachVirt next integration
1. Install server-to-server bridge in TeachVirt SWADEBASE edge/backend, not browser. Use secret manager to reference the private token; do not bake into Vite variables.
2. Private network connectivity to swadesoul port 18787 (SSH tunnel/service mesh) required for non-colocated workers.
3. Enqueue after course lesson outline/styling approval, reference course + lesson IDs in TeachVirt DB; poll status.
4. Extend template registry with education modules (opening, diagram, recap, assessment, certificate) using rigorously validated field-based template JSON. Do not allow raw user HTML or arbitrary paths.
5. Persist job state, cost, audit, retry, lesson/course ownership and exported media B2 URLs in SWADEBASE.
6. Add SSS Brain service entry and user-approved job trigger in the operating console.
7. Run one full test with a demo TeachVirt course then roll out behind a flag.
8. Add bounded worker timeouts, disk quota, persistent job storage, cleanup, authentication identity per consumer and HTTPS internal routing before production.
