# One-pass: shared client record and client intake

**Status: Spec v1, 2026-10-24, not built.** All SQL here is **NOT APPLIED**. This is part of the [site-agents section](README.md); see [SPEC.md](SPEC.md) for the versioning, audit and approval rules referred to below.

**Decided (D-17, D-18):**
- A client is **one record across all sites**. This is the **one-pass** client record. It lives in SWADEBASE as its own section, and **every agent reads and writes it**.
- New clients come in through **one shared intake skeleton**, and each site adds its own flavour.

---

## 1. What already exists (reuse, do not duplicate)

| Existing | Rows | What it is | How one-pass uses it |
|---|---|---|---|
| `public.onepass_identities` | 259 | Sign-in identity: `swade_user_id`, `source_user_id`, `email`, `display_name`, `status`, `entitlements`, `source` | The client record **links to** `swade_user_id` when the client has an account |
| `public.onepass_memberships` | 128 | Membership and entitlements per user | Read for "what does this client have" |
| `public.onepass_clients` | 21 | OAuth **apps** (client_id, redirect URIs). These are not people | Not a client record. The name collides, so one-pass people records use the term **client record** |
| `public.onepass_legacy_identities`, `onepass_onboarding_deliveries`, `onepass_authorization_codes*` | 0 | Migration and OAuth helpers | Unchanged |
| Per-site `onepass_*` (abagale wallets, plans and roles; swdzsite apps and grants; tokencsi and seedleaker founder links; agentmarketplace links) | — | Site-side entitlement models | Unchanged. Sites keep their own product data |
| `abagale.client_intake_forms` | 2 | abagale's channel-client intake (org, channel name, Roku, sponsorships, SOW) | Becomes abagale's **intake flavour** (§4) |
| Incident "SWADEBASE OnePass" | 1 (investigating, high) | Existing OnePass issue | The one-pass rollout must check it first |

The abagale repo calls OnePass the "swadesoul.com hub (separate identity client)" (`swade/migration.yml`, `docs/ONEPASS_ROLLOUT.md`). One-pass *identity* stays owned by Big Mamma (`onepass` shared component). The one-pass **client record** sits beside it.

## 2. The record

There are three new tables, all in `public` beside the existing `onepass_*` tables. Together they form the one-pass section.

| Table | One row per | Key fields |
|---|---|---|
| `onepass_client_records` | Person or organisation | `client_id` (uuid), `swade_user_id` (nullable; prospects may have no account), `primary_email` (normalised, unique case-insensitive), `display_name`, `org_name`, `kind` (customer, client, sponsor, partner, prospect, vendor), `phones[]`, `preferred_channel`, `consent` (marketing opt-in, with source and time), `suppressed` (mirrors `suppressed_emails`), `tags[]`, `risk_flags[]`, `summary` (≤ 1000 chars, no secrets), `status` (active, dormant, merged, do_not_contact) |
| `onepass_client_site_links` | Client × site | `client_id`, `site_slug`, `role` (customer, subscriber, channel_client, sponsor, student, …), `site_user_ref` (id in that site's schema), `stripe_customer_ref` (**written by Finance only**; an id, not a secret), `first_seen`, `last_seen`, `value_30d` (aggregate from Finance), `owner_agent` (`site-<slug>`) |
| `onepass_client_events` | Thing that happened | `client_id`, `site_slug`, `kind` (intake, ticket, reply_drafted, reply_sent, purchase, refund, note, merge), `ref` (ticket id, intake id, …), `summary`, `at`. Append-only |

Every row carries `version`, `as_of` and `field_as_of`, and every write lands in `sot_events` (SPEC §4, §14).

## 3. Read and write rules

1. **Any agent may create or update a client record** (D-18), through `POST/PATCH /v1/onepass/clients`. Writes are direct. **Newer writes win per field.** A stale write is kept as history, never applied (SPEC §4).
2. **Look up before create:** the lookup is by normalised email, then by `swade_user_id`, then by phone. If a record exists, the agent links its site to it and does not create a duplicate.
3. **Site override, scoped:** the site agent has override on **its own `onepass_client_site_links` rows** and on events for its site. For the shared core fields (name, email, phones, consent), newer-wins applies to every agent equally. Exception: `consent` and `suppressed` can only become **more** restrictive automatically. Loosening them needs evidence from the client (an event ref), and Swade or CoS approves.
4. **Visibility, no silos with privacy (open, O-09; recommendation):**
   - A site agent sees the full core record of any client linked to its site.
   - It sees **which** other sites the client is linked to, with the role and last-seen date.
   - It does **not** see another site's tickets, payments or private notes. It asks that site agent by message (SPEC §5.4).
   - Big Mamma, CoS and Swade see everything.
5. **Merging duplicates:** any agent can propose a merge. Big Mamma verifies it and the merge is executed. The loser record gets `status = merged`, `merged_into`, and nothing is deleted. Because merge is reversible from history, it is not a Swade gate, but it is listed in the daily summary.
6. **PII hygiene:**
   - No card data, passwords or IDs.
   - Messages and logs refer to `client_id`, not email.
   - A deletion request from a client is a **delete**, so it is Swade-gated. The record becomes `do_not_contact` immediately, and the deletion is executed after approval.
7. **Customer-facing sends stay drafts** (standing rule). Writing `reply_drafted` is fine. `reply_sent` happens only after approval or under a standing grant.

## 4. Shared client intake skeleton (D-17)

Each intake is stored as a `onepass_client_events` row (`kind = intake`), with the full form in `data`. It is linked to the client record, which is created or matched, and to the site.

**Skeleton (every site):**

| Section | Fields |
|---|---|
| Who | name, email, phone (optional), organisation, role, country/time zone, preferred contact channel |
| Consent | contact consent (required), marketing opt-in (optional), terms version accepted |
| What | site, request type (`new_project`, `subscription`, `support`, `partnership`, `sponsorship`, `other`), description, goals |
| Scope | budget range, timeline, assets or links provided, existing accounts on other Swade sites (triggers one-pass linking) |
| Routing | owner agent (`site-<slug>`), priority, follow-up date, status (`new`, `triaged`, `awaiting_client`, `proposal_drafted`, `won`, `lost`) |
| Audit | source (form, email, chat, phone), received at, `as_of` |

**Per-site flavour** is stored in `site_knowledge` with kind `intake_flavor`, and is owned by the site agent:

| Site | Extra fields |
|---|---|
| abagale | From `abagale.client_intake_forms`: preferred channel name and category, monetisation preference, subscription price preference, wants Roku / sponsorships / watch rooms, content description and sources, social links, brand colours, assets notes, SOW draft |
| videosaywhat | Video type, source links (YouTube intake), length, deadline, style references |
| teachvirt | Course topic, audience, number of lessons, credits plan, instructor bio |
| resinglab | Artist name, tracks or stems, genre, release plan, rights confirmation |
| tokencsi | Investigation type, token or contract address, chain, urgency |
| makemycoin | Coin or token concept, chain, launch timeline, compliance acknowledgement *(fields to confirm after its data move)* |

**Flow:**
1. Intake is received.
2. One-pass lookup or create.
3. Site link.
4. Event.
5. The site agent triages it and drafts any reply or proposal (draft only).
6. Approval requests go to Swade where needed.
7. The intake appears in the daily summary.

## 5. Appendix: one-pass SQL (NOT APPLIED)

```sql
-- NOT APPLIED --------------------------------------------------------------
create table if not exists public.onepass_client_records (
  client_id uuid primary key default gen_random_uuid(),
  swade_user_id uuid,                                   -- matches onepass_identities.swade_user_id when an account exists
  primary_email text, display_name text, org_name text,
  kind text not null default 'prospect' check (kind in ('customer','client','sponsor','partner','prospect','vendor')),
  phones text[] not null default '{}', preferred_channel text,
  consent jsonb not null default '{}', suppressed boolean not null default false,
  tags text[] not null default '{}', risk_flags text[] not null default '{}',
  summary text check (char_length(summary) <= 1000),
  status text not null default 'active' check (status in ('active','dormant','merged','do_not_contact')),
  merged_into uuid references public.onepass_client_records(client_id),
  version bigint not null default 1, as_of timestamptz not null default now(),
  field_as_of jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by text
);
create unique index if not exists onepass_client_email_ci on public.onepass_client_records (lower(primary_email))
  where primary_email is not null and status <> 'merged';
create index if not exists onepass_client_user on public.onepass_client_records (swade_user_id);

create table if not exists public.onepass_client_site_links (
  client_id uuid not null references public.onepass_client_records(client_id),
  site_slug text not null, role text not null,
  site_user_ref text, stripe_customer_ref text,          -- Finance-only field
  first_seen timestamptz, last_seen timestamptz, value_30d numeric(14,2),
  owner_agent text,
  version bigint not null default 1, as_of timestamptz not null default now(), field_as_of jsonb not null default '{}',
  primary key (client_id, site_slug, role)
);

create table if not exists public.onepass_client_events (
  id bigint primary key generated always as identity,
  client_id uuid not null references public.onepass_client_records(client_id),
  site_slug text, kind text not null check (kind in ('intake','ticket','reply_drafted','reply_sent','purchase','refund','note','merge')),
  ref text, summary text, data jsonb not null default '{}', actor text not null, at timestamptz not null default now()
);
-- RLS on; deny anon/authenticated; SWADE Connect enforces onepass:read:linked visibility (§3.4).
-- NOT APPLIED --------------------------------------------------------------
```
