# Asset Machine
Production module for the existing SWADEBASE adapter service. Derived from the existing Asset Review core; app data, cookie paths and encrypted object prefixes are isolated.
Owner role requires verified SWADEBASE super-admin identity. Only owner can grant roles. Admin can manage projects; reviewer sees only assigned legal work; clients see own cases and released reports.
Run `node --test test/core.test.mjs`. Apply schema.sql through the existing migration process, then add `assetMachineRoutes(ctx)` to the adapter handler list. Requires existing protected Asset Review storage and voice environment; app encryption key is HMAC-derived with Asset Machine domain separation.
Never copy secrets into source. Never run test fixtures against real client identifiers.
External issuer/custodian/oracle/issuance/settlement integrations remain unavailable.
