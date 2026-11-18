# Site launch plan

> **FOUNDER DECISION 18:28 CT: no domain purchases.** Launch every site in groups B/C as `<site>.swadebase.cloud` (subdomain of SWADEBASE). Step 2 below becomes: create the subdomain. Purchase approval question is withdrawn.
 — sites failing in Watchtower (2026-10-30, 23:30Z)
Requested by Swade 18:14 CT: "all those sites should've been launched — make a plan; fix ownmode.live; remove maestroradio.live (now themaestroradio.com)."

## Done now
- Watchtower monitor: removed "Maestro Radio Live" (maestroradio.live); ADDED "Maestro Radio" https://themaestroradio.com (it was not monitored). Target files updated; backup in /opt/watchtower/backups/.

## What we found (verified 23:15–23:30Z)
Root cause is not the sites — it is **domains**. Checked with public DNS (1.1.1.1, 8.8.8.8), WHOIS and the SWADEBASE domain-manager availability search (Namecheap).

| Group | Domains | Meaning |
|---|---|---|
| A. Wrong address in monitor; site IS live | swideo.live -> **swideo.com** (200); makemycoin.cash -> **makemycoin.live** (200); teachvirt.com -> **teachvirt.courses** (200) | Fix the monitor only |
| B. Domain NOT owned — available to buy now | digidollz.xyz $7.99 · swadez.com $16.99 · shamoneswade.com $16.99 · grwnx.io $34.99 · holistichive.health $6.99 · xrplfactory.cash $6.99 · aimaestro.consulting $6.99 | Buy (founder approval: spends money) |
| C. No DNS at all; availability not yet checked | rwafactory.cash · recapcoin.cash · grwnup.digital (grwnup.com is live on Squarespace) · cmvault.email · sterline.digital | Run availability check, then same as B |
| D. Domain owned, site missing | **ownmode.live** — Namecheap DNS points at Emergent hosting (same hosts as pinhub.live); Emergent returns 404: the site was unpublished or detached | Re-publish in Emergent or rebuild |
| E. Not checked yet | fortavaz.replit.app · swadesaidit-rose.vercel.app | Check |

## Lovable projects matched (main workspace zqwkVASZWIJCjVHgyBG3, all published)
digidollz [4e756371] · Swadez-related [096ade34] · XRPL [7b901abd] · RWA [ba6b5dbc] · Sterline [cbf39bc3] · CorpVault Ai (CMVault?) [20054034] · coin/MakeMyCoin [0df64a55] · Swideo [a2fe7a1f] · TeachVirt [ee80aad6].
**No project found in either Lovable workspace** for: GRWNx, Shamone Swade, Holistic HIVE, Recap Coin, AI Maestro, OwnMode -> likely Emergent/Replit/Vercel/elsewhere. Swade to confirm where each lives.

## Launch procedure per site (same every time; uses what SWADEBASE already has)
1. **Confirm** the intended domain + which project is the real site (Swade, 1 line each).
2. **Domain**: use `<site>.swadebase.cloud` (no purchases, founder decision 2026-10-30).
3. **Host**: per locked-in rule, sites move off Lovable onto SWADEBASE (Coolify on Control, or nginx on Core) with their data. Fast interim: attach the domain to the existing Lovable publish so it is live today, then migrate.
4. **DNS + SSL**: domain-manager `connect`/`check-dns` (namecheap.domains.dns.setHosts) -> Let's Encrypt.
5. **Sign-in**: add the domain (and its *.lovable.app address) to SWADEBASE Google sign-in redirect allowlist; test login + super admin.
6. **Verify**: page 200 on iPad Safari + desktop, auth, data, admin.
7. **Monitor**: add the correct address to Watchtower; remove wrong ones.
8. **Document**: Site Bible entry + this plan's status row.

## Order (cheapest/fastest wins first)
1. Group A: fix 3 monitor addresses (now, no cost).
2. OwnMode (Group D): Swade checks Emergent -> if the project exists, re-publish + re-attach ownmode.live (minutes). If not, rebuild on SWADEBASE (no source in GitHub — only Emergent has it).
3. Group B/C purchases: one approval for the list (~$100 total for B at listed prices; C after its check).
4. Launch in priority order Swade chooses; each site = steps 3–8.

## Open questions for Swade
- Confirm each intended domain (some may be meant to be .com / .live like swideo.com).
- Where do GRWNx, Shamone Swade, Holistic HIVE, Recap Coin, AI Maestro and OwnMode's code live?
- Approve buying the Group B domains?
