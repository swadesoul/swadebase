# Swade Soul — favicon and SEO remediation audit

Observed: 2026-11-16 (UTC scan). Prepared with existing SWADEBASE/Hostinger/GitHub tools; $0 Lovable credits and no paid generation.

**59 checked URLs; 33 had at least one icon/metadata signal; 17 unreachable/unknown; 13 GitHub source correction sets prepared; 20 initially flagged URLs remain unpatched.** Older audit included non-Lovable or historical sites; do not assume all are currently on Lovable. This is a scanner finding, not SEO index proof.

## Corrected source repositories and evidence

| Brand | GitHub revision | Delivery state |
|---|---|---|
| ReSingLab | [9fd51bd](https://github.com/swadesoul/resing/commit/9fd51bd) | Hostinger stage live; production external |
| Token CSI | [b056f91](https://github.com/swadesoul/tokencsi/commit/b056f91) | branch only |
| PubliSwade | [72750df](https://github.com/swadesoul/publiswade/commit/72750df) | branch only |
| SWIDEO | [b8092b0](https://github.com/swadesoul/swideo/commit/b8092b0) | branch only |
| MyDistribution | [ee600ef](https://github.com/swadesoul/my-distribution/commit/ee600ef) | branch only |
| Keyvity | [76f4ac4](https://github.com/swadesoul/keyvity/commit/76f4ac4) | branch only |
| VideoSayWhat | [1aa59d6](https://github.com/swadesoul/videosaywhat/commit/1aa59d6) | branch only |
| Swoney | [ef75601](https://github.com/swadesoul/swoney/commit/ef75601) | branch only |
| The FREQ | [ac3dae9](https://github.com/swadesoul/thefreq/commit/ac3dae9) | branch only |
| VirtTeach | [6f66c26](https://github.com/swadesoul/virtteach/commit/6f66c26) | branch only |
| Oathloom | [146c3cd](https://github.com/swadesoul/oathloom/commit/146c3cd) | branch only |
| ABAGALE | [e28697a](https://github.com/swadesoul/abagale/commit/e28697a) | branch only |
| FrontDesk DNA | [13c671b](https://github.com/swadesoul/dnafront/commit/13c671b) | branch only |

**Release precautions:** All twelve other repositories were pushed only to `fix/owner-favicon-seo-20261116` branches to avoid triggering Lovable production deployments. ReSingLab main and Hostinger HTTPS staging are updated; live `resinglab.com` remains external and unchanged until cutover acceptance. Do not merge, DNS-cutover, provider-publish or trigger paid services without full site-specific acceptance.

## Findings still requiring investigation

| URL | Observed signal | Actionability |
|---|---|---|
| https://sssbrain.lovable.app | NO_CANONICAL | Historical builder preview, prioritize sssbrain.live instead |
| https://swadesoul.com | BUILDER_SOCIAL_IMAGE, NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://swadeholdings.com | NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://haroldwhaley.com | BUILDER_SOCIAL_IMAGE | Find authoritative current source and owned artwork; stage before cutover |
| https://pinhub.live | NO_SOCIAL_IMAGE, NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://idonfts.com | NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://maestroradio.live | NO_ICON_LINK, NO_SOCIAL_IMAGE, NO_DESCRIPTION, NO_CANONICAL | Check canonical themaestroradio.com / inactive alias |
| https://maestroradio.app | NO_ICON_LINK, BUILDER_SOCIAL_IMAGE, NO_CANONICAL | Check if active/retired radio alias |
| https://midnightcircuit.live | NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://seedleaker.com | BUILDER_SOCIAL_IMAGE, NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://corpvault.live | BUILDER_SOCIAL_IMAGE, NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://digidollz.xyz | NO_SOCIAL_IMAGE, NO_CANONICAL | Parked domain, verify ownership/current project |
| https://attobahn.live | NO_SOCIAL_IMAGE, NO_CANONICAL | Intentional maintenance page noindex and branded icon already present |
| https://agentmarketplace.diy | NO_ICON_LINK, BUILDER_SOCIAL_IMAGE | Find authoritative current source and owned artwork; stage before cutover |
| https://swadespace.com | NO_CANONICAL | Find authoritative current source and owned artwork; stage before cutover |
| https://swadebase.cloud | NO_ICON_LINK, NO_SOCIAL_IMAGE, NO_DESCRIPTION, NO_CANONICAL | API/operations gateway; evaluate actual marketing route, not gateway root |
| https://video.frequencyrun.space | NO_ICON_LINK, NO_SOCIAL_IMAGE, NO_DESCRIPTION, NO_CANONICAL | Check if video player/API vs public marketing |
| https://swadepower.cloud | NO_ICON_LINK, NO_SOCIAL_IMAGE, NO_DESCRIPTION, NO_CANONICAL | Check if API/tool gateway |
| https://kynavo.swadeswade-s-8788.chatgpt.site | NO_ICON_LINK, NO_SOCIAL_IMAGE, NO_CANONICAL | ChatGPT Sites preview, not a verified Lovable deployment |
| https://brainiak.live | NO_SOCIAL_IMAGE, NO_CANONICAL | 302 to swadebase.cloud/brainiak; inspect destination metadata |

## Unreachable/unknown (not zero-value or absent)

- https://teachvirt.com: URLError:<urlopen error [Errno -2] Name or service not known>
- https://swadez.com: URLError:<urlopen error [Errno -2] Name or service not known>
- https://makemycoin.cash: URLError:<urlopen error [Errno -2] Name or service not known>
- https://rwafactory.cash: URLError:<urlopen error [Errno -2] Name or service not known>
- https://xrplfactory.cash: URLError:<urlopen error [Errno -2] Name or service not known>
- https://recapcoin.cash: URLError:<urlopen error [Errno -2] Name or service not known>
- https://grwnup.digital: URLError:<urlopen error [Errno -2] Name or service not known>
- https://swideo.live: URLError:<urlopen error [Errno -2] Name or service not known>
- https://cmvault.email: URLError:<urlopen error [Errno -2] Name or service not known>
- https://grwnx.io: URLError:<urlopen error [Errno -2] Name or service not known>
- https://sterline.digital: URLError:<urlopen error [Errno -2] Name or service not known>
- https://fortavaz.replit.app: HTTPError:HTTP Error 404: Not Found
- https://shamoneswade.com: URLError:<urlopen error [Errno -2] Name or service not known>
- https://aimaestro.consulting: URLError:<urlopen error [Errno -2] Name or service not known>
- https://swadesaidit-rose.vercel.app: HTTPError:HTTP Error 404: Not Found
- https://holistichive.health: URLError:<urlopen error [Errno -2] Name or service not known>
- https://ownmode.live: HTTPError:HTTP Error 404: Not Found

## Verification and known blockers

- Static metadata + asset existence checks: 13/13 source correction sets passed; TanStack TSX syntax checks passed for SSR root routes.
- ReSingLab TypeScript and Vite build passed; staging page rendered new logo/OG/description. Its live production remains on external hosting.
- Token CSI initial build failed because its pre-existing Lovable MCP Vite plugin refuses to overwrite a user-maintained function. Restricting the plugin to development restored production build without calling Lovable or replacing MCP code. Existing unrelated package-lock changes not committed.
- PubliSwade Vite build passed. SWIDEO Vite/Nitro build needed increased Node heap and then passed. MyDistribution Vite/Nitro build passed after reconciling an already stale lockfile locally; the generated lockfile was not included in the SEO branch.
- Other metadata-only HTML files were parsed and own assets verified in source; signed-in/live/browser production acceptance has not been performed for these new branches.
- Dynamic ReSingLab Song/EPK metadata uses React Helmet client-side; search/social crawlers may require SSR/prerender for rich previews. This was not implemented or certified in this batch.
- GitHub branches are not equivalent to live domain publishing. No broad DNS cutover or Lovable deployment attempted.
- No user data, accounts, DNS, payments, OAuth, media, or shared infrastructure modified by this batch.

## Repeatable read-only scan

`python3 /opt/swadebase/ops/brand-seo-audit/audit.py` (no credentials or paid external APIs).

## Backout

ReSingLab: revert only SEO commit `9fd51bd` (or restore prior main and rebuild vetted stage) without reverting unrelated Maestro commits. Other 12: delete or revert the isolated `fix/owner-favicon-seo-20261116` branch; no production cutover performed. Preserve concurrent changes, recheck canonical Site Bible and no secrets.

## Final staging header correction — 2026-11-16 ~13:51 CT
Verified ReSingLab HTTPS staging was initially missing `X-Robots-Tag` on the actual root because Nginx location-level cache headers override inherited server `add_header` directives. Backed up exact original stage-only Nginx config at `/opt/swadebase/backups/brand-seo-20261116/stage-resinglab-nginx-before-headers.conf`, added explicit `X-Robots-Tag: noindex, nofollow, noarchive`, short HSTS and nosniff to affected HTTPS location blocks; `nginx -t` and reload succeeded. Direct HTTPS GET/HEAD now return `x-robots-tag`, `strict-transport-security`, `x-content-type-options`; stage root and public production both remain HTTP 200. This is a site-specific hardening change, not public production migration. Restore only the backed-up stage file and reload if needed.
