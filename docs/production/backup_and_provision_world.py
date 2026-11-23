#!/usr/bin/env python3
"""Backup shared Maestro station rows, then dry-run or apply Maestro World provision.

Usage:
  backup_and_provision_world.py --backup-only
  backup_and_provision_world.py --dry-run
  backup_and_provision_world.py --apply
Never prints passwords, API keys, or tokens.
"""
import json, os, sys, time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, "/opt/maestro-assistant/factory")
import factory as f
import station_libraries as sl

FOUNDER = "f6e059a4-ea87-46ac-9b8e-cda2b047b979"
SLUG = "maestro-world"
SHORT = "maestro_world"
GOSPEL_ID = "27b3ba27-9257-4b69-b6c4-dbcf3cc87ddd"

TABLES = [
    ("stations", "maestroradio"),
    ("station_library_settings", "maestroradio"),
    ("station_folder_rules", "maestroradio"),
    ("station_library_requests", "maestroradio"),
    ("station_library_media", "maestroradio"),
    ("ai_djs", "maestroradio"),
    ("live_dj_accounts", "maestroradio"),
    ("station_week_settings", "maestroradio"),
]

REDACT_KEYS = {"password", "api_key", "apikey", "token", "secret", "authorization", "credential"}


def mask(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if any(x in k.lower() for x in REDACT_KEYS):
                out[k] = "<redacted>"
            else:
                out[k] = mask(v)
        return out
    if isinstance(obj, list):
        return [mask(x) for x in obj]
    return obj


def snapshot_stations():
    rows = f.db(
        "stations",
        select="id,name,slug,status,visibility,genre,azuracast_station_id,azuracast_shortcode,logo_url,stream_url,updated_at",
        order="azuracast_station_id.asc",
    )
    return rows


def backup(backup_dir: Path):
    backup_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(backup_dir, 0o700)
    meta = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "purpose": "Pre-change backup before provisioning Maestro World",
        "note": "Do not invent World logo art. Passwords/keys not stored here.",
    }
    for table, schema in TABLES:
        try:
            rows = f.db(table, schema=schema, limit=5000)
            (backup_dir / f"{schema}_{table}.json").write_text(
                json.dumps(mask(rows), indent=2, default=str) + "\n"
            )
            meta.setdefault("tables", {})[f"{schema}.{table}"] = len(rows) if isinstance(rows, list) else "unknown"
        except Exception as e:
            meta.setdefault("table_errors", {})[f"{schema}.{table}"] = type(e).__name__
    # AzuraCast station list without auth material
    try:
        engine_stations = sl.engine(f, "/api/admin/stations", "GET")
        slim = []
        if isinstance(engine_stations, list):
            for s in engine_stations:
                slim.append({k: s.get(k) for k in ("id", "name", "shortcode", "short_name", "is_enabled", "genre", "url") if k in s or True})
                # keep only safe fields
                item = {k: s.get(k) for k in ("id", "name", "shortcode", "short_name", "is_enabled", "is_public", "genre", "description", "listen_url", "frontend_type", "backend_type")}
                slim[-1] = item
        (backup_dir / "azuracast_stations_safe.json").write_text(json.dumps(slim, indent=2, default=str) + "\n")
        meta["azuracast_station_count"] = len(slim)
    except Exception as e:
        meta["azuracast_error"] = type(e).__name__
    (backup_dir / "stations_snapshot.json").write_text(json.dumps(snapshot_stations(), indent=2, default=str) + "\n")
    (backup_dir / "MANIFEST.json").write_text(json.dumps(meta, indent=2, default=str) + "\n")
    return meta


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry-run"
    f.ENV = f.load_env()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_dir = Path(f"/opt/swadebase/backups/maestro-world-{stamp}")
    if mode in {"--backup-only", "--dry-run", "--apply"}:
        meta = backup(backup_dir)
        print(json.dumps({"backup": str(backup_dir), "meta_tables": meta.get("tables"), "azuracast_station_count": meta.get("azuracast_station_count")}, indent=2, default=str))
    if mode == "--backup-only":
        return

    before = snapshot_stations()
    gospel_before = [r for r in before if r.get("id") == GOSPEL_ID or r.get("slug") == "maestro-gospel"]
    existing = [r for r in before if r.get("slug") == SLUG or r.get("azuracast_shortcode") == SHORT]
    print("STATIONS_BEFORE", json.dumps(before, default=str))
    print("GOSPEL_BEFORE", json.dumps(gospel_before, default=str))
    print("WORLD_EXISTING", json.dumps(existing, default=str))

    if existing:
        print(json.dumps({"idempotent": True, "action": "skip_create", "station": existing[0], "backup": str(backup_dir)}, indent=2, default=str))
        return

    body = json.loads(Path("/opt/swadebase/docs/production/maestro-world-provision.json").read_text())
    # Re-read immediately before calling provision
    again = snapshot_stations()
    if any(r.get("slug") == SLUG or r.get("azuracast_shortcode") == SHORT for r in again):
        print(json.dumps({"idempotent": True, "action": "skip_create_race", "backup": str(backup_dir)}, indent=2))
        return
    gospel_again = [r for r in again if r.get("id") == GOSPEL_ID or r.get("slug") == "maestro-gospel"]
    if json.dumps(gospel_again, default=str) != json.dumps(gospel_before, default=str):
        print(json.dumps({"abort": "gospel_changed_before_write", "before": gospel_before, "again": gospel_again}, indent=2, default=str))
        sys.exit(2)

    actor = {"id": FOUNDER, "superadmin": True, "admin": True}
    if mode == "--dry-run":
        body["dry_run"] = True
        out = sl.provision(f, actor, body)
        print("DRY_RUN", json.dumps(mask(out), indent=2, default=str))
        after = snapshot_stations()
        if after != again:
            print("ERROR dry-run changed rows")
            sys.exit(3)
        print("DRY_RUN_NO_CHANGES", True)
        return

    if mode != "--apply":
        print("unknown mode", mode)
        sys.exit(2)

    body["dry_run"] = False
    out = sl.provision(f, actor, body)
    print("APPLY", json.dumps(mask(out), indent=2, default=str))
    after = snapshot_stations()
    gospel_after = [r for r in after if r.get("id") == GOSPEL_ID or r.get("slug") == "maestro-gospel"]
    world_after = [r for r in after if r.get("slug") == SLUG]
    print("GOSPEL_AFTER", json.dumps(gospel_after, default=str))
    print("WORLD_AFTER", json.dumps(world_after, default=str))
    if json.dumps(gospel_after, default=str) != json.dumps(gospel_before, default=str):
        print("WARNING gospel_row_changed")
        sys.exit(4)
    print("GOSPEL_UNCHANGED", True)
    # Confirm draft/private and not live
    st = world_after[0]
    print("STATUS_CHECK", json.dumps({
        "status": st.get("status"),
        "visibility": st.get("visibility"),
        "shortcode": st.get("azuracast_shortcode"),
        "engine": st.get("azuracast_station_id"),
        "logo_url": st.get("logo_url"),
        "stream_url": st.get("stream_url"),
    }, default=str))
    (backup_dir / "provision_result_redacted.json").write_text(json.dumps(mask(out), indent=2, default=str) + "\n")
    (backup_dir / "stations_after.json").write_text(json.dumps(after, indent=2, default=str) + "\n")


if __name__ == "__main__":
    main()
