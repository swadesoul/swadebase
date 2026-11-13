# Audio Engine Guard — 2026-11-13 18:00 CT
Checks every audio program every 15 minutes for the RK-013 family (silent pause, stuck queue, provider down). Catalog: repair-kit-known-failures.md.

| Check | Result | Detail |
|---|---|---|
| Music provider (sunoapi.org) | OK | credit check answered; 29506.5 credits left |
| Maestro generation switch | OK | on |
| Maestro Radio song factory stuck work | WARN | 1 job(s) not moving for over 30 min (oldest update 2026-11-10 05:37) |
| ReSing Lab generation stuck work | OK | none |
| ReSing Lab music jobs stuck work | OK | none |
| ReSing Lab songs stuck work | OK | none |
| ReSing Lab stem split stuck work | OK | none |
| Sonikyn production stuck work | OK | none |
| ReSing voice training stuck work | OK | none |
| Music ingest stuck work | OK | none |
| Music model training stuck work | OK | none |
| Maestro queue nudge | OK | {"status": "ok", "started": null} |
| Worker maestro-factory-tick.timer | OK | active |
| Worker maestro-dj-render.timer | OK | active |
