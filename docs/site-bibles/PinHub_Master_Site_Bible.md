# PinHub Master Site Bible

Status as of 2026-10-30: NOT MIGRATED to SWADEBASE. Founder calls PinHub one of the major sites; it must be brought into SWADEBASE and made reachable through SSS Brain.

## What PinHub is
pinhub.live: "IPFS Storage + FirstClaim Registry". Pins files to IPFS (Pinata) and records timestamped first-claim proofs (Solana explorer links present), with wallet login (wagmi), user profiles and a CMS.

## Where it lives today (verified 2026-10-30)
- Domain: pinhub.live, DNS at Namecheap (registrar-servers.com), resolves to Cloudflare; served by Emergent hosting (__emg_ cookies).
- Frontend: Create-React-App build (/static/js/main.*.js) from Emergent.
- Backend API: https://ipfspin.emergent.host (routes seen: /api/auth/register, /api/profile/me, /api/ipfs/upload, /api/cms/analytics).
- Database/auth: old HOSTED Supabase project bunllpycbchfyctnakak (ecosystem moved off hosted Supabase to Swadebase.cloud in Oct 2026; PinHub was not moved).
- IPFS: Pinata, dedicated gateway pinhub.mypinata.cloud.
- Source: the Emergent app source is NOT on GitHub. GitHub swadesoul/pinhubdigital (Lovable project 466cdf42-9298-4aa5-9d05-8b10a065c63b, pinhubdigital.lovable.app) holds only a new homepage shell (TanStack Start, one route, no backend), last commit 2026-10-25.

## Update 2026-10-31 02:16 CT (founder)
Founder rebuilt PinHub in Lovable and killed the Emergent app. Lovable is now PinHub's home (project 466cdf42-9298-4aa5-9d05-8b10a065c63b, repo swadesoul/pinhubdigital). Verified 02:20 CT: the Lovable project / repo still contain only the homepage (last edit 2026-10-26); pinhub.live still served the Emergent build (title "IPFS Storage & FirstClaim Registry") at that time. Emergent features (upload, FirstClaim registry, wallet login, profiles, CMS) must be rebuilt on SWADEBASE; user/pin/claim data still sits in hosted Supabase bunllpycbchfyctnakak and must be exported before that project is shut down. Do not repoint pinhub.live DNS until founder approves.

## Existing SWADEBASE pieces that overlap
- Edge function ipfs-publisher (Pinata pinFileToIPFS, CID v1). PINATA_JWT is NOT set in supabase-edge-functions as of 2026-10-30.
- Edge functions abg-mint-to-ipfs, abg-mint-partner-nft also reference Pinata.
- Asset Review lists "Pinhub issuance" as not enabled.

## Planned consumers
- Maestro Radio / ReSingLab Voice IDs: each voice gets a permanent Voice ID and an optional "Pin to PinHub" Voice Passport (public passport + 30 s audition clip; persona provider IDs and full recipe prompts stay private).

## Open items before migration
1. Export Emergent source to GitHub (Emergent "Save to GitHub") or rebuild on the Lovable shell.
2. Export users/pins/claims from hosted Supabase bunllpycbchfyctnakak into Swadebase.cloud.
3. Locate Pinata JWT (check SWADEBASE-2 Coolify shared variables first) and load it server-side only.
4. Expose PinHub as a SWADEBASE adapter callable from SSS Brain.
5. Repoint pinhub.live DNS only after parity is verified.
