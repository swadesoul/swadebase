#!/usr/bin/env python3
"""Backup shared Maestro rows, provision Maestro Country (draft), apply R&B-style week grid, copy Karriann.

Usage:
  backup_and_provision_country.py --backup-only
  backup_and_provision_country.py --dry-run
  backup_and_provision_country.py --apply
Never prints passwords, API keys, or tokens. Does not start broadcast or set the station live.
"""
import base64, hashlib, json, os, re, subprocess, sys, tempfile, uuid
import importlib.util
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, "/opt/maestro-assistant/factory")
import factory as f
import station_libraries as sl
import rotation_holds

FOUNDER = "f6e059a4-ea87-46ac-9b8e-cda2b047b979"
ACTOR = {"id": FOUNDER, "superadmin": True, "admin": True}
SLUG = "maestro-country"
SHORT = "maestro_country"
NAME = "Maestro Country"
GOSPEL_ID = "27b3ba27-9257-4b69-b6c4-dbcf3cc87ddd"
WORLD_ID = "aea1bab2-72e7-4344-b1c7-a59aaf1f885d"
FLAGSHIP_ID = "cbbbfcd6-e76c-4b4d-9dc4-596319468def"
RADIO_ENGINE = 1
GOSPEL_ENGINE = 14
LOGO_URL = "https://themaestroradio.com/station-logos/maestro-country.webp"
LOGO_PATH = Path("/var/www/maestroradio-web/current/station-logos/maestro-country.webp")
VINYL_PATH = Path("/var/www/maestroradio-web/releases/20261121T0115Z-shared-covers/station-records/maestro-country-vinyl.webp")
PROVISION_JSON = Path("/opt/swadebase/docs/production/maestro-country-provision.json")
KARRMANN = [
    {"source": 95, "artist": "Karriann Swade", "genre": "Country"},
    {"source": 96, "artist": "Karriann Swade", "genre": "Country"},
]
SOURCE_PLAYLIST_NAMES = {
    24: "Maestro Country Mornings · Music",
    25: "Midday Country · Music",
    26: "Country Drive Time · Music",
    27: "Country Nights · Music",
    28: "Country Overnight · Music",
    29: "Country Weekend Wake-Up · Music",
    30: "Saturday Country · Music",
    31: "Sunday Country · Music",
}

TABLES = [
    ("stations", "maestroradio"),
    ("station_library_settings", "maestroradio"),
    ("station_folder_rules", "maestroradio"),
    ("station_library_requests", "maestroradio"),
    ("station_library_media", "maestroradio"),
    ("station_week_settings", "maestroradio"),
    ("station_week_grid", "maestroradio"),
    ("station_engine_playlists", "maestroradio"),
    ("ai_djs", "maestroradio"),
    ("live_dj_accounts", "maestroradio"),
]
REDACT_KEYS = {"password", "api_key", "apikey", "token", "secret", "authorization", "credential"}


def mask(obj):
    if isinstance(obj, dict):
        return {k: ("<redacted>" if any(x in k.lower() for x in REDACT_KEYS) else mask(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [mask(x) for x in obj]
    return obj


def snapshot_stations():
    return f.db(
        "stations",
        select="id,name,slug,status,visibility,genre,azuracast_station_id,azuracast_shortcode,logo_url,stream_url,updated_at",
        order="azuracast_station_id.asc",
    )


def backup(backup_dir: Path):
    backup_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(backup_dir, 0o700)
    meta = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "purpose": "Pre-change backup before provisioning Maestro Country",
        "note": "Use existing Country logo/vinyl only. Passwords/keys not stored here.",
    }
    for table, schema in TABLES:
        try:
            rows = f.db(table, schema=schema, limit=5000)
            (backup_dir / f"{schema}_{table}.json").write_text(json.dumps(mask(rows), indent=2, default=str) + "\n")
            meta.setdefault("tables", {})[f"{schema}.{table}"] = len(rows) if isinstance(rows, list) else "unknown"
        except Exception as e:
            meta.setdefault("table_errors", {})[f"{schema}.{table}"] = type(e).__name__
    try:
        engine_stations = sl.engine(f, "/api/admin/stations", "GET")
        slim = []
        if isinstance(engine_stations, list):
            for s in engine_stations:
                slim.append({k: s.get(k) for k in ("id", "name", "shortcode", "short_name", "is_enabled", "is_public", "genre", "description", "listen_url", "frontend_type", "backend_type")})
        (backup_dir / "azuracast_stations_safe.json").write_text(json.dumps(slim, indent=2, default=str) + "\n")
        meta["azuracast_station_count"] = len(slim)
    except Exception as e:
        meta["azuracast_error"] = type(e).__name__
    (backup_dir / "stations_snapshot.json").write_text(json.dumps(snapshot_stations(), indent=2, default=str) + "\n")
    gospel_files = sl.engine(f, f"/api/station/{GOSPEL_ENGINE}/files")
    (backup_dir / "azuracast_gospel_snapshot_do_not_modify.json").write_text(
        json.dumps([{k: x.get(k) for k in ("id", "artist", "title", "genre", "path", "playlists")} for x in gospel_files], indent=2, default=str) + "\n"
    )
    radio = sl.engine(f, f"/api/station/{RADIO_ENGINE}/files")
    (backup_dir / "azuracast_flagship_files_safe.json").write_text(
        json.dumps([{k: x.get(k) for k in ("id", "artist", "title", "genre", "path", "length", "playlists")} for x in radio], indent=2, default=str) + "\n"
    )
    (backup_dir / "MANIFEST.json").write_text(json.dumps(meta, indent=2, default=str) + "\n")
    return meta, gospel_files, radio


def relabel(label: str) -> str:
    label = label.replace("Gospel Sunday", "Sunday Country").replace("Sunday Soul", "Sunday Country")
    label = label.replace("Maestro Mornings", "Maestro Country Mornings")
    label = label.replace("The Maestro Morning Mix", "The Maestro Country Morning Mix")
    if "Morning Mix replay" in label or "Country Morning Mix replay" in label or "Late Night" in label:
        if "Sunday" in label:
            return "Sunday Country Late Night"
        return "Country Late Night"
    # after the Morning Mix replace, replay labels may already say The Maestro Country Morning Mix replay
    label = label.replace("The Maestro Country Morning Mix replay", "Country Late Night")
    label = label.replace("The Maestro Country Morning Mix replay: Sunday Edition", "Sunday Country Late Night")
    return label


def load_week_grid_mod():
    spec = importlib.util.spec_from_file_location("native_week_grid", "/opt/swadebase/signal/week_grid_sync.py")
    grid = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(grid)
    return grid


def clean_title(title, artist):
    t = re.sub(r"\s+", " ", (title or "").strip())
    t = re.sub(r"^eMastered\s+", "", t, flags=re.I)
    aliases = []
    if artist:
        aliases += [artist, re.sub(r"\s+Swade$", "", artist, flags=re.I)]
    aliases += ["Karriann Swade", "Karriann"]
    for a in aliases:
        a = (a or "").strip()
        if not a:
            continue
        t = re.sub(r"\s*[-–—]\s*" + re.escape(a) + r"\s*$", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip(" -_")
    t = re.sub(r"\s+\(", " (", t)
    return t or (title or "").strip()


def ffprobe_duration(data):
    with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        probe = json.loads(subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_format", "-of", "json", path],
            timeout=25, stderr=subprocess.DEVNULL))
        return float(probe["format"]["duration"])
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def find_country():
    rows = snapshot_stations()
    return [r for r in rows if r.get("slug") == SLUG or r.get("azuracast_shortcode") == SHORT]


def apply_logo(st):
    if not LOGO_PATH.is_file():
        return {"ok": False, "error": "logo file missing on disk"}
    if st.get("logo_url") == LOGO_URL:
        return {"ok": True, "already": True, "logo_url": LOGO_URL, "vinyl_exists": VINYL_PATH.is_file()}
    if st.get("logo_url"):
        return {"ok": True, "skipped": "logo_url already set", "logo_url": st.get("logo_url")}
    f.patch("stations", st["id"], {"logo_url": LOGO_URL})
    return {"ok": True, "logo_url": LOGO_URL, "vinyl_exists": VINYL_PATH.is_file(), "vinyl_path": str(VINYL_PATH) if VINYL_PATH.is_file() else None}


def apply_week_grid(st, backup_dir: Path):
    """Mirror R&B rnb-program.py: daypart playlists + flagship week structure + engine schedules."""
    sid = int(st["azuracast_station_id"])
    existing_grid = f.db("station_week_grid", filters={"station_id": "eq." + st["id"]}, limit=200)
    rules = f.db("station_folder_rules", filters={"station_id": "eq." + st["id"]})
    music_rule = next((r for r in rules if r.get("folder") == "music/Music" and r.get("category") == "music"), None)
    if not music_rule:
        raise SystemExit("Country music/Music folder rule missing")
    music_pid = int(music_rule["playlist_id"])
    source_grid = f.db("station_week_grid", filters={"station_id": "eq." + FLAGSHIP_ID}, order="day.asc,start_hm.asc", limit=200)
    if len(source_grid) != 55:
        raise SystemExit("Flagship week grid is not 55 slots; refusing to copy")
    used_ids = sorted({g["music_playlist_id"] for g in source_grid} | {g["fallback_playlist_id"] for g in source_grid if g.get("fallback_playlist_id")})
    unexpected = [i for i in used_ids if i not in SOURCE_PLAYLIST_NAMES and i != 52]
    if unexpected:
        raise SystemExit("Unexpected flagship playlist ids in grid: %s" % unexpected)

    before = sl.engine(f, f"/api/station/{sid}/playlists")
    (backup_dir / "country_playlists_before.json").write_text(json.dumps(before, indent=2, default=str) + "\n")
    by_name = {p["name"]: p for p in before}
    pmap = {}
    created = []
    for old, name in SOURCE_PLAYLIST_NAMES.items():
        if name in by_name:
            pmap[old] = int(by_name[name]["id"])
            continue
        result = sl.engine(f, f"/api/station/{sid}/playlists", "POST", {
            "name": name, "type": "default", "source": "songs", "order": "shuffle",
            "weight": 3, "is_enabled": True, "include_in_requests": True, "avoid_duplicates": True,
        })
        pid = int(result["id"])
        pmap[old] = pid
        created.append({"source_id": old, "name": name, "id": pid})
        by_name[name] = result
    pmap[52] = pmap[31]

    if existing_grid:
        # Idempotent: keep existing grid, still ensure engine schedules match it.
        grid_mod = load_week_grid_mod()
        pls = sl.engine(f, f"/api/station/{sid}/playlists")
        items, eff, actual = grid_mod.desired(st["id"], pls)
        for pid, schedules in items.items():
            sl.engine(f, f"/api/station/{sid}/playlist/{pid}", "PUT", {"schedule_items": schedules, "is_enabled": True})
        return {
            "idempotent": True,
            "playlist_map": {str(k): v for k, v in pmap.items() if k != 52},
            "music_playlist_id": music_pid,
            "created_playlists": created,
            "slot_count": len(existing_grid),
        }

    rows = []
    for g in source_grid:
        src_pid = g["music_playlist_id"]
        if src_pid not in pmap:
            raise SystemExit("No Country mapping for flagship playlist %s" % src_pid)
        rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, "https://themaestroradio.com/operations/maestro-country-20261123/grid/" + g["id"])),
            "station_id": st["id"],
            "day": g["day"],
            "start_hm": g["start_hm"],
            "end_hm": g["end_hm"],
            "label": relabel(g["label"]),
            "music_playlist_id": pmap[src_pid],
            "fallback_playlist_id": music_pid,
            "min_songs": 1,
            "show_slug": None,
            "show_edition": None,
            "talk_tone": "standard" if "Gospel" not in (g.get("label") or "") and "Sunday" not in (g.get("label") or "") else "spiritual",
            "notes": "Country music uses the existing Maestro time structure, same method as Maestro R&B (week_grid_sync schedules). Speech and advertising insertions await verified replacement audio. No DJ voice was copied.",
            "updated_by": FOUNDER,
        })
    for day in range(1, 8):
        dayrows = sorted((r for r in rows if r["day"] == day), key=lambda r: r["start_hm"])
        assert dayrows[0]["start_hm"] == 0 and dayrows[-1]["end_hm"] == 2400 and all(a["end_hm"] == b["start_hm"] for a, b in zip(dayrows, dayrows[1:]))
    # Sunday Country dayparts should not stay 'spiritual' unless they were gospel; relabeled Sunday Country can be standard.
    for r in rows:
        if r["label"].startswith("Sunday Country") and "Gospel" not in r["label"]:
            if r["talk_tone"] == "spiritual" and "Late Night" not in r["label"] and r["label"] != "Sunday Country":
                pass
        # Use standard talk tone; no Country gospel block was provisioned.
        r["talk_tone"] = "standard"

    f.db("station_week_grid", "POST", rows)
    f.db("station_week_settings", "POST", {
        "station_id": st["id"],
        "clock": "maestro-hour",
        "clock_notes": "Existing Maestro hour structure with Country-only music. Speech and advertising insertions await verified replacement audio.",
        "ad_minutes": [21, 51],
        "apply_mode": "auto",
        "pending_sync": False,
    }, upsert=True)

    grid_mod = load_week_grid_mod()
    pls = sl.engine(f, f"/api/station/{sid}/playlists")
    items, eff, actual = grid_mod.desired(st["id"], pls)
    if len(actual) != 55:
        raise SystemExit("Country grid did not resolve to 55 slots")
    for pid, schedules in items.items():
        sl.engine(f, f"/api/station/{sid}/playlist/{pid}", "PUT", {"schedule_items": schedules, "is_enabled": True})
    after = {p["id"]: p for p in sl.engine(f, f"/api/station/{sid}/playlists")}
    assert all(grid_mod.norm(after[pid].get("schedule_items") or []) == grid_mod.norm(want) for pid, want in items.items())
    now = datetime.now(timezone.utc).isoformat()
    f.db("station_engine_playlists", "POST", [
        {"station_id": st["id"], "engine_id": p["id"], "name": p["name"], "type": p["type"],
         "num_songs": p.get("num_songs") or 0, "is_enabled": p["is_enabled"],
         "managed_by_grid": p["id"] in items, "synced_at": now}
        for p in after.values()
    ], upsert=True)
    result = {
        "playlist_map": {str(k): v for k, v in pmap.items() if k != 52},
        "music_playlist_id": music_pid,
        "created_playlists": created,
        "slot_count": 55,
        "engine_schedules_verified": True,
        "timezone": "America/Chicago",
    }
    f.db("station_week_settings", "PATCH", {
        "pending_sync": False,
        "last_sync_at": now,
        "last_sync_result": result,
    }, filters={"station_id": "eq." + st["id"]})
    return result


def week_playlist_ids(st):
    rules = f.db("station_folder_rules", filters={"station_id": "eq." + st["id"]})
    music_rule = next((r for r in rules if r.get("folder") == "music/Music" and r.get("category") == "music"), None)
    music_pid = int(music_rule["playlist_id"])
    grid = f.db("station_week_grid", filters={"station_id": "eq." + st["id"]}, limit=200)
    ids = {music_pid}
    for g in grid:
        if g.get("music_playlist_id"):
            ids.add(int(g["music_playlist_id"]))
        if g.get("fallback_playlist_id"):
            ids.add(int(g["fallback_playlist_id"]))
    return music_pid, sorted(ids)


def put_dest_tags(engine_id, dest_mid, title, artist, genre, playlists, path):
    sl.engine(f, f"/api/station/{engine_id}/file/{int(dest_mid)}", "PUT",
              {"title": title, "artist": artist, "genre": genre})
    members = sorted(set(int(x) for x in playlists))
    sl.engine(f, f"/api/station/{engine_id}/files/batch", "PUT", {
        "do": "playlist", "currentDirectory": "", "files": [path], "dirs": [], "playlists": members,
    })
    verify = sl.engine(f, f"/api/station/{engine_id}/file/{int(dest_mid)}")
    have = {int(x["id"]) for x in verify.get("playlists") or []}
    if not set(members) <= have:
        sl.fail("Playlist synchronization needs review (have %s want %s)." % (sorted(have), members), 502)
    return verify


def copy_karriann(st, radio_index):
    sid = int(st["azuracast_station_id"])
    rules = f.db("station_folder_rules", filters={"station_id": "eq." + st["id"]})
    music_rule = next((r for r in rules if r.get("folder") == "music/Music" and r.get("category") == "music"), None)
    folder_id = music_rule["id"]
    music_pid, playlists = week_playlist_ids(st)
    existing = f.db("station_library_media", filters={"station_id": "eq." + st["id"]}, limit=2000)
    added, skipped = [], []
    for job in KARRMANN:
        mid = int(job["source"])
        artist, genre = job["artist"], job["genre"]
        src = radio_index.get(mid)
        if not src:
            skipped.append({"source": mid, "reason": "flagship engine file missing"})
            continue
        title = clean_title(src.get("title") or "", artist)
        already = None
        why = None
        for m in existing:
            if m.get("source_media_id") is not None and int(m["source_media_id"]) == mid:
                already, why = m, "source_media_id"
                break
            if (m.get("title") or "").strip().casefold() == title.casefold():
                already, why = m, "title"
                break
        if already:
            skipped.append({"source": mid, "title": title, "reason": "already on station (%s)" % why, "existing_media_id": already.get("media_id")})
            continue
        filename = re.sub(r"[^A-Za-z0-9._ -]+", "", title).strip() or "track"
        if not filename.lower().endswith(".mp3"):
            filename += ".mp3"
        with rotation_holds.operation_lock(blocking=True):
            data = sl.engine(f, f"/api/station/{RADIO_ENGINE}/file/{mid}/play", raw=True)
            if not data:
                skipped.append({"source": mid, "title": title, "reason": "empty audio from flagship play API"})
                continue
            try:
                duration = ffprobe_duration(data)
            except Exception:
                duration = src.get("length") or 0
            rid = str(uuid.uuid4())
            body = {
                "station_id": st["id"],
                "folder_id": folder_id,
                "upload_id": rid,
                "filename": filename,
                "title": title,
                "artist": artist,
            }
            out = sl.upload(f, ACTOR, body, data)
            row = out["track"]
            dest_mid = row.get("media_id")
            path = "music/Music/" + rid + ".mp3"
            put_dest_tags(sid, dest_mid, title, artist, genre, playlists, path)
            try:
                f.patch("station_library_media", rid, {"source_media_id": mid})
                row = f.one("station_library_media", rid)
            except Exception:
                pass
        added.append({
            "source": mid, "title": title, "artist": artist, "genre": genre,
            "dest_media_id": dest_mid, "library_id": row.get("id"),
            "duration_sec": duration, "bytes": len(data), "path": path,
            "playlists": playlists, "status": row.get("status"),
        })
        existing.append(row)
    return added, skipped, music_pid, playlists


def music_playable(engine_id, music_playlist_id):
    files = sl.engine(f, f"/api/station/{engine_id}/files")
    n = sum(1 for item in files if music_playlist_id in {int(x["id"]) for x in (item.get("playlists") or [])})
    return n, len(files)


def flagship_fingerprint(radio):
    out = {}
    for item in radio:
        mid = int(item["id"])
        out[mid] = {
            "playlists": sorted(int(x["id"]) for x in (item.get("playlists") or [])),
            "artist": item.get("artist"), "title": item.get("title"),
            "genre": item.get("genre"), "path": item.get("path"),
        }
    return out


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry-run"
    f.ENV = f.load_env()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_dir = Path(f"/opt/swadebase/backups/maestro-country-{stamp}")
    meta, gospel_files_before, radio_before = backup(backup_dir)
    print(json.dumps({"backup": str(backup_dir), "meta_tables": meta.get("tables"), "azuracast_station_count": meta.get("azuracast_station_count")}, indent=2, default=str))
    if mode == "--backup-only":
        return

    before = snapshot_stations()
    gospel_before = [r for r in before if r.get("id") == GOSPEL_ID or r.get("slug") == "maestro-gospel"]
    world_before = [r for r in before if r.get("id") == WORLD_ID or r.get("slug") == "maestro-world"]
    flag_before = [r for r in before if r.get("id") == FLAGSHIP_ID]
    existing = find_country()
    print("GOSPEL_BEFORE", json.dumps(gospel_before, default=str))
    print("WORLD_BEFORE", json.dumps(world_before, default=str))
    print("COUNTRY_EXISTING", json.dumps(existing, default=str))
    flag_fp_before = flagship_fingerprint(radio_before)
    gospel_files_slim = [{k: x.get(k) for k in ("id", "artist", "title", "genre", "path")} for x in gospel_files_before]

    body = {
        "name": NAME,
        "slug": SLUG,
        "genre": "Country",
        "library_mode": "mixed",
        "visibility": "private",
        "description": "Modern country radio: country pop, traditional and neotraditional, country rap, Southern rock, bluegrass color, and country gospel. A dedicated home for country on Maestro Radio.",
        "sftp": True,
        "start_broadcast": False,
    }
    PROVISION_JSON.parent.mkdir(parents=True, exist_ok=True)
    if not PROVISION_JSON.exists():
        PROVISION_JSON.write_text(json.dumps(body, indent=2) + "\n")
        os.chmod(PROVISION_JSON, 0o644)
    else:
        body = json.loads(PROVISION_JSON.read_text())
        body["start_broadcast"] = False

    if mode == "--dry-run":
        if existing:
            print(json.dumps({"idempotent": True, "action": "skip_create", "station": existing[0], "backup": str(backup_dir)}, indent=2, default=str))
        else:
            body["dry_run"] = True
            out = sl.provision(f, ACTOR, body)
            print("DRY_RUN_PROVISION", json.dumps(mask(out), indent=2, default=str))
            after = snapshot_stations()
            if after != before:
                print("ERROR dry-run changed station rows")
                sys.exit(3)
            print("DRY_RUN_NO_STATION_CHANGES", True)
        print("DRY_RUN_LOGO", LOGO_URL, "disk", LOGO_PATH.is_file(), "vinyl", VINYL_PATH.is_file())
        print("DRY_RUN_GRID_PLAN", json.dumps({
            "method": "rnb-program.py equivalent via week_grid_sync.desired + engine playlist schedules",
            "source_slots": 55,
            "daypart_names": list(SOURCE_PLAYLIST_NAMES.values()),
            "karriann": [{"source": j["source"], "flagship_title": (flag_fp_before.get(j["source"]) or {}).get("title")} for j in KARRMANN],
            "keep_status": "draft",
            "keep_visibility": "private",
        }, indent=2))
        return

    if mode != "--apply":
        print("unknown mode", mode)
        sys.exit(2)

    # Re-read immediately before writes
    again = snapshot_stations()
    gospel_again = [r for r in again if r.get("id") == GOSPEL_ID or r.get("slug") == "maestro-gospel"]
    if json.dumps(gospel_again, default=str) != json.dumps(gospel_before, default=str):
        print(json.dumps({"abort": "gospel_changed_before_write", "before": gospel_before, "again": gospel_again}, indent=2, default=str))
        sys.exit(2)
    world_again = [r for r in again if r.get("id") == WORLD_ID or r.get("slug") == "maestro-world"]
    if json.dumps(world_again, default=str) != json.dumps(world_before, default=str):
        print(json.dumps({"abort": "world_changed_before_write", "before": world_before, "again": world_again}, indent=2, default=str))
        sys.exit(2)

    provision_out = None
    existing = [r for r in again if r.get("slug") == SLUG or r.get("azuracast_shortcode") == SHORT]
    if existing:
        st = f.one("stations", existing[0]["id"])
        print("IDEMPOTENT_SKIP_CREATE", st["id"])
    else:
        body["dry_run"] = False
        provision_out = sl.provision(f, ACTOR, body)
        print("APPLY_PROVISION", json.dumps(mask(provision_out), indent=2, default=str))
        created = find_country()
        if not created:
            print("ERROR station not found after provision")
            sys.exit(4)
        st = f.one("stations", created[0]["id"])

    logo = apply_logo(st)
    print("LOGO", json.dumps(logo, default=str))
    st = f.one("stations", st["id"])

    grid_result = apply_week_grid(st, backup_dir)
    print("GRID", json.dumps(grid_result, indent=2, default=str))

    radio_now = {int(x["id"]): x for x in sl.engine(f, f"/api/station/{RADIO_ENGINE}/files")}
    added, skipped, music_pid, playlists = copy_karriann(st, radio_now)
    print("COPIED", json.dumps({"added": added, "skipped": skipped, "week_playlists": playlists}, indent=2, default=str))

    # Post checks
    after = snapshot_stations()
    gospel_after = [r for r in after if r.get("id") == GOSPEL_ID or r.get("slug") == "maestro-gospel"]
    world_after = [r for r in after if r.get("id") == WORLD_ID or r.get("slug") == "maestro-world"]
    country_after = [r for r in after if r.get("slug") == SLUG]
    st = country_after[0]
    radio_after = sl.engine(f, f"/api/station/{RADIO_ENGINE}/files")
    flag_fp_after = flagship_fingerprint(radio_after)
    flag_changed = []
    for mid, b in flag_fp_before.items():
        a = flag_fp_after.get(mid)
        if a != b:
            flag_changed.append({"source": mid, "before": b, "after": a})
    gospel_files_after = [{k: x.get(k) for k in ("id", "artist", "title", "genre", "path")} for x in sl.engine(f, f"/api/station/{GOSPEL_ENGINE}/files")]
    playable, engine_files = music_playable(int(st["azuracast_station_id"]), music_pid)

    report = {
        "backup": str(backup_dir),
        "station": st,
        "logo": logo,
        "grid": grid_result,
        "added": added,
        "skipped": skipped,
        "playable_music": playable,
        "engine_files": engine_files,
        "needed_for_25": max(0, 25 - playable),
        "week_playlists": playlists,
        "flagship_changed": flag_changed,
        "gospel_unchanged": json.dumps(gospel_after, default=str) == json.dumps(gospel_before, default=str) and gospel_files_slim == gospel_files_after,
        "world_unchanged": json.dumps(world_after, default=str) == json.dumps(world_before, default=str),
        "country_status": st.get("status"),
        "country_visibility": st.get("visibility"),
        "go_live_stream_url": "https://radio.themaestroradio.com/listen/maestro_country/radio.mp3",
        "temporary_stream_url": st.get("stream_url"),
    }
    (backup_dir / "provision_result_redacted.json").write_text(json.dumps(mask(provision_out), indent=2, default=str) + "\n")
    (backup_dir / "result_apply.json").write_text(json.dumps(report, indent=2, default=str) + "\n")
    (backup_dir / "stations_after.json").write_text(json.dumps(after, indent=2, default=str) + "\n")
    print("REPORT", json.dumps({
        "backup": str(backup_dir),
        "station_id": st.get("id"),
        "engine_id": st.get("azuracast_station_id"),
        "shortcode": st.get("azuracast_shortcode"),
        "status": st.get("status"),
        "visibility": st.get("visibility"),
        "logo_url": st.get("logo_url"),
        "stream_url": st.get("stream_url"),
        "playable_music": playable,
        "needed_for_25": max(0, 25 - playable),
        "added": len(added),
        "skipped": skipped,
        "flagship_changed": len(flag_changed),
        "gospel_unchanged": report["gospel_unchanged"],
        "world_unchanged": report["world_unchanged"],
    }, indent=2, default=str))
    if json.dumps(gospel_after, default=str) != json.dumps(gospel_before, default=str):
        print("WARNING gospel_row_changed")
        sys.exit(4)
    if st.get("status") != "draft":
        print("WARNING country status is not draft")
        sys.exit(5)


if __name__ == "__main__":
    main()
