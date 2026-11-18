# SWADEBASE favicon and SEO inventory audit

Run read-only: `python3 /opt/swadebase/ops/brand-seo-audit/audit.py`.
Reads the canonical older 56-site inventory `/opt/swadebase/docs/branding-audit-20261029.json`, plus six known extra ecosystem URLs; checks public HTML for icons, description, canonical, social image, and known builder-hosted preview assets. No credentials, AI, Lovable API, purchases, domain writes or paid requests. Results in date-keyed `/opt/swadebase/docs/branding-audit-live-YYYYMMDD.json`.

Interpret limitations carefully: 1) 404/timeouts are unknown, not proof a site is dead; 2) client-side metadata from React Helmet may not be visible in initial HTML; 3) a site may be a gateway or redirect, not a marketing page; 4) existing icon links need per-site HTTP/image checks and design approval; 5) a GitHub patch is not a verified deployment; 6) no automatic DNS, OAuth, or payment adjustments. Review protected site bibles and live staging before release.
