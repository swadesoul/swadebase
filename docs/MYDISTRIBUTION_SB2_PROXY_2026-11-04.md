# mydistribution.swadebase.cloud → Coolify SB2 proxy (2026-11-04)

**Why:** Coolify app `sva8hi0vu4o6mo6t0rwklaug` on SWADEBASE-2 (`2.25.96.150`) is healthy. Public Hostinger A for `mydistribution.swadebase.cloud` still points at primary `2.25.74.73` (Hostinger DNS API timed out). Namecheap cannot edit `swadebase.cloud`.

**What:** Primary nginx site `/etc/nginx/sites-available/mydistribution.swadebase.cloud` terminates LE TLS and reverse-proxies HTTPS to `2.25.96.150` with Host `mydistribution.swadebase.cloud` (`proxy_ssl_verify off` — Traefik still has default cert until DNS flips).

**Cert:** `/etc/letsencrypt/live/mydistribution.swadebase.cloud/` (expires 2027-02-02).

**Verified:** `https://mydistribution.swadebase.cloud/` → HTTP 200 Next.js (~42 KB).

**When Hostinger A flips to 2.25.96.150:** wait for Traefik LE on SB2, then disable/remove this nginx site on primary and reload.
