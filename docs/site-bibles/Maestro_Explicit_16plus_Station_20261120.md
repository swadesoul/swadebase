# Maestro Explicit — 16+ station (founder directive)
Date: 2026-11-20 America/Chicago. State: protected station build specification ONLY, not deployed; no station media publicly live.
## Product
Standalone opt-in station maestro-explicit for explicit-language music and talk, including profanity. Separate catalog, playlist, identity, cover art, DJs, station registry from all clean stations. Uncensored refers to expressive creative programming, not illegal/harmful content or unlicensed materials. No unrestricted public streaming or crossover to clean stations.
## Access and age
Authenticated account + server-side 16+ eligibility based on proportionate date-of-birth or age-assurance verification; do not expose DOB to station DJ or agent. Reject anonymous listeners and under-16 accounts at audio gateway, playlist/Now Playing/metadata/cover API and any alternate stream URL. Client-side checkbox or decorative age popup is not security. Short-lived bound stream tokens and private origin; direct underlying radio mount must not bypass authentication, signed B2 URL must not be exposed to ineligible users. Minimal data retention, privacy and jurisdiction compliance review.
## Editorial
Explicit language, challenging social themes and profanity permitted. Human production approval and abuse reporting required; no criminal activity promotion, abusive threats, copyright violation, child sexual abuse, unlawful exploitation or banned advertising. No underage personal data in descriptions; explicit album art hidden in public discovery and marked E for age-eligible sessions only.
## Submission
New song email/web form strictly LESS THAN 15MB for each audio file (<15000000 bytes), independently enforced server-side. Exact existing other station upload cap unchanged. Explicit station target is not default and requires age/content flag. Verify rights, authorship, artist consent, genre, file safety, artwork and track metadata, then producer approval. Uploading content is not a way to bypass age gating.
## Integration
Reuse SWADEBASE auth, existing Maestro station manager, AzuraCast runtime, B2 storage, signed media access, existing ReSingLab sound, VideoSayWhat translation where licensed, Maestro native scheduler; no duplicate stack, new paid provider or new account grants. Clean station and explicit station playlists/rights and analytics remain isolated.
## Tests
Anonymous direct stream 401; under16 direct 403; 16+ authenticated pass; spoofed client age denied; revoked session denied; cache/CDN/direct media bypass denied; shared player doesn't leak explicit audio; mobile/iPad Safari, station change, age verification, offsite audio URL tests; site age-gating laws/privacy and rights review; rollback deactivates only this station.
Current status: specification only; no new database schema, app code, station, public stream, age proof, music master or live deployment verified.
