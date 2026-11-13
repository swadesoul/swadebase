# SWADE SIGNATURE STANDARD v1 — "AI + SI built in"

**Status:** APPROVED. **Part of Site Standard v1 (rule 15), per Harold 2026-10-28.** Not a separate rule.
**Owner:** Harold "hDub" Whaley (super admin)
**Drafted:** 2026-10-28 · **Updated:** 2026-10-28 (v1.1: per-project digits, badge on by default, white-label opt-out)
**Reference implementation:** `swade-signature` package v1.1.0 (planned private GitHub repo `swadesoul/swade-signature`, not yet created as of 2026-10-28; box copy `/workspace/swade-signature`)

---

## 1. Rule

Every SWADEBASE system (site, app, adapter UI, kiosk) **carries the SWADE Signature** with **its own project's
registry digits**, a built-in mark that says *AI and SI are built in*. It is added through the standard
component only; nobody hand-rolls a variant. White-label client builds follow section 6.

## 2. The mark

- **Carrier:** `SW d AD d EAI d SISW d ADE d AISI` → letters read `SWADE AISI SWADE AISI`.
- **Spacing:** 2–4 letters between each digit, fixed pattern **2, 3, 4, 3**.
- **Master number:** `79233` = S-W-A-D-E on a phone keypad → `SW7AD9EAI2SISW3ADE3AISI`.
  **Reserved for SWADEBASE itself.** No project may use it.
- **Project numbers:** each project has its own five digits, pinned in `signature-registry.json`.
- **Strict regex:** `SW(\d)AD(\d)EAI(\d)SISW(\d)ADE(\d)AISI` → digits must equal the project's registry digits.

## 3. Registry (v1.1.0)

| Project | Digits | Mark |
|---|---|---|
| **swadebase** (master, reserved) | `79233` | `SW7AD9EAI2SISW3ADE3AISI` |
| themaestroradio | `68004` | `SW6AD8EAI0SISW0ADE4AISI` |
| maestro-play | `11739` | `SW1AD1EAI7SISW3ADE9AISI` |
| resinglab | `56158` | `SW5AD6EAI1SISW5ADE8AISI` |
| mydistribution | `62141` | `SW6AD2EAI1SISW4ADE1AISI` |
| publiswade | `71139` | `SW7AD1EAI1SISW3ADE9AISI` |
| petmuzik | `00414` | `SW0AD0EAI4SISW1ADE4AISI` |
| teachvert | `76729` | `SW7AD6EAI7SISW2ADE9AISI` |
| aba-gold | `60326` | `SW6AD0EAI3SISW2ADE6AISI` |
| swadesoul-com | `76206` | `SW7AD6EAI2SISW0ADE6AISI` |
| swadesoul-world | `52895` | `SW5AD2EAI8SISW9ADE5AISI` |
| groundlift | `96411` | `SW9AD6EAI4SISW1ADE1AISI` |
| sssbrain | `82032` | `SW8AD2EAI0SISW3ADE2AISI` |
| brainiak | `65778` | `SW6AD5EAI7SISW7ADE8AISI` |
| swadespace | `11329` | `SW1AD1EAI3SISW2ADE9AISI` |
| music-mogul | `40673` | `SW4AD0EAI6SISW7ADE3AISI` |

- Derivation: FNV-1a 32-bit of `"79233:<slug>:<attempt>"` mod 100000, padded to 5 digits; `attempt` increments on a
  collision or on 79233. Deterministic and collision-free.
- Entries are **pinned**: never changed or reused. New projects are appended with `npm run registry:add -- <slug>`.
- Changing the master number or the carrier is a versioned change (v2) and needs Harold's go.

## 4. Required surfaces

| # | Surface | Required? |
|---|---------|-----------|
| 1 | `<meta name="swade-signature">` (with `project=<slug>`) | **Required** |
| 2 | `data-swade-signature` (+ `data-swade-project`) on `<html>` or app root | **Required** |
| 3 | Hidden span and/or HTML comment carrying the mark | **Required** |
| 4 | Visible "AI + SI built in" badge | **On by default** on every site |
| 5 | `X-Swade-Signature` HTTP response header | Recommended (server change, needs a separate go per server) |

## 5. How it is applied

- **React / Vite / Lovable:** `<SwadeSignature project="<slug>" />` once at the app root, and the meta line in `index.html`.
- **Static nginx sites:** paste `static/projects/<slug>.html`, or `<script src="/swade-signature.js" data-project="<slug>" defer>`.
- **Servers:** the project's `X-Swade-Signature` line from `nginx/swade-signature.conf.txt`, only with Harold's go,
  after a config backup and a passing `nginx -t`.
- **Adapters:** adapter UIs and API responses may echo the header value; keys stay on SWADEBASE.

## 6. White-label opt-out

- **White-label client sites:** carrying the mark is **the client's choice**. They may leave it on (with their own
  registry digits) or turn the whole mark off: `enabled={false}` / `whiteLabel` (React) or `data-enabled="false"` (static).
  Record the choice with the client's site record.
- **SWADEBASE sites must keep it on.** The opt-out is never used on a registry project.

## 7. Verification

A site **passes** when `verify(html, { project: "<slug>" })` (or the strict regex on the page, header or bundle)
finds that project's digits. `verify()` and `identify()` report which project the digits belong to.
The **Site readiness monitor** checks this as part of Site Standard v1 (policy as of 2026-10-28; the automated check is not yet implemented in monitor code). A missing or wrong-project signature on a
SWADEBASE site is a readiness gap. A white-label site that opted out is recorded as "opted out", not a gap.

## 8. Constraints carried from existing standing rules

- Back up before editing any file; add, never overwrite.
- No secrets in the mark or header; it is public by design.
- No server, repo, Lovable or live-site change happens without Harold's go for that specific item.
- Outreach may mention the signature only for sites verified 100% ready (HARD RULE).
- The signature does not replace credits, attribution, or legal notices.

## 9. Decisions (Harold, 2026-10-28)

1. Digits vary per project; 79233 stays the family/master number for SWADEBASE.
2. Badge shows by default on every site.
3. White-label client sites may turn the mark off or leave it on (client's choice). SWADEBASE sites keep it on.
4. Part of Site Standard v1 (rule 15), checked by the Site readiness monitor. Not a separate rule 16.
5. Component to be published to a private GitHub repo (`swadesoul/swade-signature`).
