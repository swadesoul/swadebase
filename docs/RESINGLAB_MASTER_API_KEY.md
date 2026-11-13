# ReSing Lab master music-api key (SWADEBASE)

Short inventory note. **Do not put the secret value in this file, in git, in chat, or in daily logs.**

- **Name:** SWADEBASE Master (future use)
- **Account:** Swade Soul's ReSing Lab user (`f6e059a4-ea87-46ac-9b8e-cda2b047b979`)
- **Key row id:** `c1f4b2f4-df74-4454-a822-50a71c87d617`
- **Created:** 2026-11-12, about 1:32 PM CST (UTC-6), at founder request for a REST API with all permissions, pay-exempt, stored on SWADEBASE for future use
- **Storage:** `/opt/swade-secrets/resinglab-master-api.env` variable `RESINGLAB_MASTER_API_KEY` (root:root, mode 600). Same location pattern as other ecosystem secrets.
- **Scopes:** `generate`, `status`, `cover`, `persona`, `stems`, `sounds`, `exports`, `mixes`, and `*`
- **Endpoint:** `POST https://swadebase.cloud/functions/v1/music-api/v1/<route>` with header `x-api-key`. Gateway may also require a valid Supabase JWT (the publishable/anon key is sufficient). `verify_jwt` is disabled on this function in ReSing config; the shared functions gate may still expect a Bearer token.
- **Exemption:** Existing `resinglab.profiles.is_admin_exempt` was already true (Master). An existing-table row was added: `resinglab.resinglab_payment_exemptions` id `1718212b-b0c6-4f77-a75d-1a31bc8ae5d3`, `feature_key=all`, `enabled=true`, no expiry. That is the official catch-all used by `paymentExemptAcross` so music-api does not debit credits (`api_usage` / `generation_credits`). Audit row written. No new billing bypass was invented.
- **Compatibility fix (minimal):** Live `resinglab.api_keys` used `key_hash`, while `music-api` / `generate-api-key` look up `api_key_hash`, and `resinglab.generate_api_key()` was missing after the schema move. Added `api_key_hash` (kept in sync with `key_hash` by trigger) and restored `resinglab.generate_api_key()` in the official `rsl_` format. Backup: `/root/backups/resinglab-master-api-20261112T193210Z/`
- **Verified:** Authenticated `POST /functions/v1/music-api/v1/usage` returned HTTP 200. Credits stayed 5000 / 5000.
- **Note:** `music-api` `/v1/cover` is Suno's upload-cover (a cover *recording*), not album artwork. Album art uses `resinglab-generate-cover-image` / `generate-cover-art`.
- **Revoke:** Set the key inactive and stamp `revoked_at`; disable the exemption; remove the secret file:

```sql
UPDATE resinglab.api_keys
   SET is_active = false, revoked_at = now()
 WHERE id = 'c1f4b2f4-df74-4454-a822-50a71c87d617';

UPDATE resinglab.resinglab_payment_exemptions
   SET enabled = false, updated_at = now()
 WHERE id = '1718212b-b0c6-4f77-a75d-1a31bc8ae5d3';
```

```bash
rm /opt/swade-secrets/resinglab-master-api.env
```

`is_admin_exempt` on the profile was pre-existing and should not be flipped by a key revoke.
