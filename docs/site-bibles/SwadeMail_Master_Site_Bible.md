# SwadeMail Master Site Bible

Version 1.0 — 2026-10-30T00:47:10.741639+00:00. Existing Mailcow and Mail Center, not a new mail service.

## Purpose and ownership
Founder-only mailbox management and research-contact access at https://swadebase.cloud/adapters/mail-center. Mailcow host is mail.swadesoul.com; individual product domains use their own full mailbox address as both IMAP and SMTP username.

## Device setup — deployed
Connect to device is available for every actual mailbox returned by Mailcow. The existing owner session and CSRF checks protect settings lookup. Settings: IMAP 993 SSL/TLS; SMTP 587 STARTTLS with password authentication; alternative SMTP 465 SSL/TLS. Mailcow config hostname and public TLS certificates for 993 and 587 were verified. Reuse Mailcow's mailbox-authenticated /mobileconfig.php?only_email for Apple profiles; no password is embedded or retrieved. Instructions can be copied or opened as an unsent email draft. The mailbox owner also receives settings after completing the existing private one-use password setup flow. Five focused mail/device tests passed; JavaScript/module syntax and anonymous 401 passed. Actual iPad account installation remains unverified.

## Research contacts — partial live integration
Use existing sssbrain.brain_crm_contacts, restricted by the original user's SWADEBASE JWT and existing RLS. Mail Center's Connect contacts uses an existing allowed Google/GoTrue redirect to obtain a user session; the existing login page exchanges and stores that token in its current sessionStorage mechanism. No service-role token, new database grants or SECURITY DEFINER reader was added. Search is server-filtered and bounded to 100 records per request. Email links open drafts; Do Not Cold Pitch records require their documented route and missing emails stay blank. Authenticated browser rendering remains unverified.

Forty records from Library file libfile_e40f67b676bc81918c51c42c60b73a06 (SwadeSoul_Qualified_Investor_Database_2026.csv) were imported; 18 have email fields. Repeat import inserted zero and reported 40 duplicates. Original research metadata, evidence URLs, outreach restrictions and import date are preserved in CRM notes. Records are labeled source imports, not freshly reverified investors. Nothing was emailed.

Importer: /opt/swadebase/ops/whats-new/import-research-contacts.py, owner-verified, bounded JSON batches <=500 rows/4 MB, evidence required, no sending. Inputs: /opt/swadebase/var/contact-imports, private mode. Existing records and source files are retained.

## Daily transfer
Existing 300 Black Businesses Daily task 6add1723a6c481919b19cac9c66c5cdc now includes the verified importer and actual receipt requirements. New Research Contact Sync task 6ae3e711c3808191b2652cd2b2d9f2ee runs every morning around 9 AM America/Chicago to catch up new business/investor exports. Scheduling success is not a first completed future import. The October 28 Black-business result said 29 candidates, zero master additions and an unavailable original master collection; its named sandbox CSV was not found in Library. Its result run ID does not match the newer October 29 completed run, so it must not be attributed to that newer run. Historical business exports remain unresolved. No separate currently running investor-specific research task was established by discovery; saved investor-file imports are covered.

## Recovery and limits
Scoped baseline for changed Mail Center source: /opt/swadebase/backups/mail-device-setup-20261029. Restore touched files only if needed, then restart the adapter service; do not undo unrelated changes. Preserve imported CRM records and source references. Existing five external contact source connectors remain independently unverified; the previous source registry was a placeholder, not a searchable merged database.
