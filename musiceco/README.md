# musiceco — daily music ecosystem brief (SWADEBASE section)

Purpose: stores Harold's daily music ecosystem brief (music places, potential customers, their contacts)
and drafted outreach, so each day's brief can be compared with earlier ones and worked as a pipeline.

## Tables (schema `musiceco`)
- `places` — one row per organisation. `section` is `places` or `potential_customers`. Includes category,
  name, website, description, fit, location, email, contact_page, phone, socials (jsonb), address,
  recommended_services (text[], only Harold's services), recommended_reason, first_seen, last_seen, source_urls.
  Unique `dedupe_key` = website host+path (lower-case, no `www.`, no trailing slash); without a website, name|location.
- `contacts` — people at a place (name, title, email, phone, linkedin, socials, source_urls, do_not_contact).
  Deduped by email, then LinkedIn, then (place, name).
- `brief_entries` — which places appeared in which day's brief; key (brief_date, place_id); `is_new` when first seen that day.
- `outreach` — drafted pitches (status drafted/approved/sent/replied/declined). Drafts only: nothing is sent
  until Harold approves it. The loader never writes here.

## Access
Service-role only. RLS is on for all four tables with no policies; anon/authenticated have no grants and
cannot execute `musiceco.load_brief`. No browser app and no edge functions, so no nginx Origin routing
or gateway port was added; the only exposure is PostgREST with the `musiceco` profile, which is listed in
PGRST_DB_SCHEMAS in /opt/swadebase/docker/.env.

## Daily load
Copy that day's enriched JSON to `data/music-places-YYYY-MM-DD.json`, then:

    cd /opt/swadebase/musiceco && python3 load_brief.py data/music-places-YYYY-MM-DD.json --date YYYY-MM-DD --counts

- `--dry-run` only validates; `python3 load_brief.py --counts` only prints table counts.
- Accepts the enriched shape as-is (section, category, name, website, description, fit, location, email,
  contact_page, phone, socials, address, contact_person_name/_title/_linkedin, recommended_services,
  recommended_reason, source_urls). Nulls, empty values and placeholders like "not public" are dropped.
- Uses the existing SERVICE_ROLE_KEY from /opt/swadebase/docker/.env via https://swadebase.cloud/rest/v1/rpc/load_brief.
  The key is never printed.
- Rerun-safe: places upsert on dedupe_key, and contacts are matched by the rules above. Stored values are kept
  when the new value is empty, socials are merged and source_urls unioned. Rerunning the same file adds no rows.

## Files
- schema.sql — DDL, grants, RLS, and the load_brief function (already applied)
- load_brief.py — the loader
- parse_master.py — fallback parser for the OLD markdown format (`- [Name](url) — ... Fit: ...`) only;
  it does not handle the newer `### [Name](url)` block format
- data/ — daily input files (music-places-YYYY-MM-DD.json) and the markdown copy
