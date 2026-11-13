# Repair Kit scan — 2026-11-13 06:37 CST
Read-only daily scan of swadesoul. Catalog: repair-kit-known-failures.md. Queue: repair-kit-fix-queue.md.

| Check | Result | Detail |
|---|---|---|
| RK-009 off-server backup | OK | last 3h ago: 20261113T091927Z 254M |
| RK-009 restore test | OK | PASS 11d ago |
| RK-004 swap | OK | 0% |
| RK-004 stuck builds | OK | none over 60 min |
| Disk / | OK | 48% used |
| Certificates | OK | none expire within 21 days |
| RK-003 upload 413s | OK | 0 today |
| Server errors (5xx) | WARN | 134 today:  36 502 /adapters/promo/widget.js; 10 500 /functions/v1/verify-card; 8 503 /rest/v1/theaters; |
| RK-011 outage page | WARN | missing: browser.swadebase.cloud mydistribution.swadebase.cloud world.swadebase.cloud |
| RK-012 ports on all interfaces | INFO | 110 143 631 995 3000 3001 4190 8005 8015 8025 8035 8045 8787 8797 18000 18443 32768  (Hostinger firewall passes only 22,80,443,mail,2022,7881,5349,8005-8796,8798-8995) |
| Shield (CrowdSec) | OK | engine active, 35 alerts in 24h, 0 blocking bouncer(s) |
| Site swadebase.cloud | OK | HTTP 302 |
| Site sssbrain.live | OK | HTTP 307 |
| Site blacktales.online | OK | HTTP 200 |
| Site oathloom.com | OK | HTTP 200 |
| Site abagale.live | OK | HTTP 200 |
| Site yourown.delivery | OK | HTTP 200 |
| swadebase-2 (SSS Brain health) | OK | HTTP 200 |
| RK-007 builder badge | OK | none on nginx-served domains |

FAIL = act now (Support Desk T1/T2 or escalate). WARN = review in CoS brief. Fixes follow the catalog and rules 17, 19, 20.
