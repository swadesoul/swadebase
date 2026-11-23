#!/usr/bin/env python3
"""Build GitHub main on Hostinger; stage, verify and atomically publish ReSingLab."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

from verify_build import asset_hashes, verify, utc_time

BASE = Path("/var/www/resinglab-web")
RELEASES = BASE / "releases"
SOURCE = BASE / "source"
STAGE = Path("/opt/swadebase/staging/resinglab-ui/current")
PRODUCTION = BASE / "current"
LOCK = Path("/opt/swadebase/docs/DEPLOY_LOCK.md")
REPO = "github-all:swadesoul/resing.git"
NODE_BIN = "/root/.nvm/versions/node/v22.23.3/bin"
OWNER = "resinglab-github-hostinger"
LOCK_LINE = None
MANIFEST = "assets-manifest.json"
LEGACY_COMMIT = "e4669b17616b32a3ead301a7cd23d7d340c15aec"
LEGACY_HASH_MANIFEST = Path(__file__).with_name("legacy-e4669b1.sha256.json")
LEGACY_HASH_MANIFEST_SHA256 = "09c96ddfc4677301c450e8cf34bbea3320905e37c7195488f53b6cc240c313b9"


def now_utc():
    return dt.datetime.now(dt.timezone.utc)


def run(args, **kwargs):
    print("+ " + " ".join(map(str, args)), flush=True)
    return subprocess.run(list(map(str, args)), check=True, **kwargs)


def save_json(path, data):
    temporary = path.with_name(path.name + ".next")
    temporary.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")
    temporary.replace(path)


def verify_legacy_snapshot(target):
    """Validate only the pinned migration snapshot; never relax new-release checks."""
    if target != RELEASES / "legacy-e4669b1" or target.is_symlink() or not target.is_dir():
        raise RuntimeError("Not the exact owned legacy snapshot")
    pinned = LEGACY_HASH_MANIFEST.read_bytes()
    if hashlib.sha256(pinned).hexdigest() != LEGACY_HASH_MANIFEST_SHA256:
        raise RuntimeError("Pinned legacy hash manifest changed")
    manifest = json.loads(pinned)
    if manifest.get("version") != 1 or manifest.get("commit") != LEGACY_COMMIT:
        raise RuntimeError("Unexpected pinned legacy commit")
    actual = {}
    for path in sorted(target.rglob("*")):
        if path.is_symlink():
            raise RuntimeError("Symlink in preserved legacy snapshot")
        if path.is_file():
            actual[path.relative_to(target).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
        elif not path.is_dir():
            raise RuntimeError("Unexpected file type in preserved legacy snapshot")
    if actual != manifest.get("files"):
        raise RuntimeError("Preserved legacy snapshot has changed, extra or missing files")
    if json.loads((target / "release.json").read_text()).get("commit") != LEGACY_COMMIT:
        raise RuntimeError("Unexpected preserved legacy release identity")
    return actual


def readlink(path):
    return path.resolve() if path.is_symlink() else None


def point(link, target):
    link.parent.mkdir(parents=True, exist_ok=True)
    temporary = link.with_name(link.name + ".next")
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    temporary.replace(link)


def acquire_shared_lock(allowed_owner):
    global LOCK_LINE
    now = now_utc()
    with LOCK.open("a+") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        handle.seek(0)
        for line in handle.read().splitlines():
            if not line.strip() or line.lstrip().startswith("#") or "completed" in line or "released" in line:
                continue
            columns = [part.strip() for part in line.split("|")]
            try:
                started = utc_time(columns[0])
            except (ValueError, TypeError):
                continue
            if (now - started).total_seconds() > 7200:
                continue
            if allowed_owner and len(columns) > 1 and columns[1] == allowed_owner:
                continue
            if any(word in line.lower() for word in ["resing", "nginx", "shared", "swadesoul "]):
                print("Another operator holds the deployment lock; live release unchanged.")
                return False
        LOCK_LINE = now.isoformat() + " | " + OWNER + " | ReSingLab Hostinger frontend | GitHub main build, stage, verify, atomic publish | 25 minutes"
        handle.write("\n" + LOCK_LINE + "\n")
        return True


def release_shared_lock():
    global LOCK_LINE
    if not LOCK_LINE:
        return
    with LOCK.open("r+") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        text = handle.read().replace(LOCK_LINE, "# " + LOCK_LINE + " | released")
        handle.seek(0)
        handle.write(text)
        handle.truncate()
    LOCK_LINE = None


def set_hold(reason, commit):
    save_json(BASE / "publish.hold.json",
              {"held_at": now_utc().isoformat(), "reason": reason, "commit": commit})
    os.chmod(BASE / "publish.hold.json", 0o600)


def prune_compatibility(target, now=None):
    """Expire only explicitly recorded compatibility files, even while publishing is held."""
    path = target / MANIFEST
    if not path.is_file():
        return
    now = now or now_utc()
    manifest = json.loads(path.read_text())
    expired = [name for name, entry in manifest["compatibility"].items()
               if utc_time(entry["expires_at"]) <= now]
    for name in expired:
        if name in manifest["current_assets"] or not name.startswith("assets/") or ".." in Path(name).parts:
            raise RuntimeError("Unsafe compatibility manifest")
        (target / name).unlink(missing_ok=True)
        del manifest["compatibility"][name]
    if expired:
        save_json(path, manifest)


def compatibility_window(key, now, persist):
    path = BASE / "compatibility-retirements.json"
    windows = json.loads(path.read_text()) if path.exists() else {}
    if key in windows:
        return windows[key]
    window = {"retired_at": now.isoformat(),
              "expires_at": (now + dt.timedelta(days=7)).isoformat()}
    if persist:
        windows[key] = window
        save_json(path, windows)
    return window


def add_compatibility(target, now=None, retiring=False):
    """Copy old current assets once; inherited compatibility keeps its original expiry."""
    now = now or now_utc()
    prune_compatibility(target, now)
    manifest = json.loads((target / MANIFEST).read_text())
    current, compatibility = manifest["current_assets"], manifest["compatibility"]

    def copy(source, name, entry, replace=False):
        if name in current or utc_time(entry["expires_at"]) <= now:
            return
        if name in compatibility and not replace:
            if compatibility[name]["sha256"] != entry["sha256"]:
                raise RuntimeError("Conflicting fingerprinted compatibility asset")
            return
        candidate = source / name
        if not candidate.is_file() or candidate.is_symlink():
            raise RuntimeError("Missing compatibility asset")
        import hashlib
        if hashlib.sha256(candidate.read_bytes()).hexdigest() != entry["sha256"]:
            raise RuntimeError("Compatibility asset checksum mismatch")
        destination = target / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        if candidate != destination:
            shutil.copy2(candidate, destination)
        compatibility[name] = dict(entry)

    old = readlink(PRODUCTION)
    if old and old != target and old != RELEASES / "legacy-e4669b1":
        old_manifest = json.loads((old / MANIFEST).read_text())
        # Inherited entries are never given another seven days.
        for name, entry in old_manifest["compatibility"].items():
            copy(old, name, entry)
        window = compatibility_window("release:" + old.name, now, retiring)
        for name, digest in old_manifest["current_assets"].items():
            copy(old, name, {"sha256": digest, "source_commit": old_manifest["commit"],
                            "kind": "previous-release", **window}, replace=True)

    legacy = RELEASES / "legacy-e4669b1"
    if legacy.is_dir():
        # Created once for this migration, never renewed by a later build or rollback.
        window = compatibility_window("migration-legacy", now, True)
        if utc_time(window["expires_at"]) > now:
            for name, digest in verify_legacy_snapshot(legacy).items():
                if name.startswith("assets/"):
                    copy(legacy, name, {"sha256": digest, "source_commit": LEGACY_COMMIT,
                                       "kind": "migration-legacy", **window})
    save_json(target / MANIFEST, manifest)


def probe(host, expected):
    body = run(["curl", "--fail", "--silent", "--show-error", "--max-time", "20",
                "--resolve", host + ":443:127.0.0.1", "https://" + host + "/release.json"],
               capture_output=True, text=True).stdout
    if json.loads(body).get("commit") != expected:
        raise RuntimeError("Release identity mismatch on " + host)
    for route in ["/healthz", "/", "/auth", "/dashboard/resinglab/remix?tool=cover&edit=lyrics"]:
        run(["curl", "--fail", "--silent", "--show-error", "--max-time", "20", "--resolve",
             host + ":443:127.0.0.1", "https://" + host + route], stdout=subprocess.DEVNULL)


def stage(target):
    previous = readlink(STAGE)
    try:
        point(STAGE, target)
        probe("stage-resinglab.swadebase.cloud", json.loads((target / "release.json").read_text())["commit"])
    except Exception:
        if previous:
            point(STAGE, previous)
        else:
            STAGE.unlink(missing_ok=True)
        raise


def activate(target, *, allow_legacy_rollback=False):
    if target.parent != RELEASES or not (target / "index.html").is_file():
        raise RuntimeError("Release is outside the owned release directory")
    expected = json.loads((target / "release.json").read_text())["commit"]
    if target == RELEASES / "legacy-e4669b1":
        hold = BASE / "publish.hold.json"
        if (not allow_legacy_rollback or not hold.is_file()
                or json.loads(hold.read_text()).get("commit") != LEGACY_COMMIT):
            raise RuntimeError("Legacy snapshot requires an explicit held rollback")
        verify_legacy_snapshot(target)
    else:
        add_compatibility(target, retiring=True)
        verify(target)
    previous = readlink(PRODUCTION)
    try:
        point(PRODUCTION, target)
        probe("resinglab.com", expected)
    except Exception:
        set_hold("Activation failed; restored previous release. Use --resume after repair.", expected)
        if previous:
            point(PRODUCTION, previous)
        else:
            PRODUCTION.unlink(missing_ok=True)
        raise
    if previous and previous != target:
        point(BASE / "previous", previous)
    (BASE / "production.enabled").touch(mode=0o600)
    print("Verified production release: " + expected)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage-only", action="store_true")
    operation = parser.add_mutually_exclusive_group()
    operation.add_argument("--activate", action="store_true")
    operation.add_argument("--rollback", action="store_true")
    operation.add_argument("--resume", action="store_true",
                           help="Deliberately clear the rollback hold and deploy current GitHub main.")
    parser.add_argument("--allow-lock-owner", default="")
    args = parser.parse_args()
    if args.stage_only and (args.activate or args.rollback or args.resume):
        parser.error("--stage-only cannot be combined with --activate, --rollback or --resume")
    BASE.mkdir(parents=True, exist_ok=True)
    RELEASES.mkdir(exist_ok=True)
    os.environ["PATH"] = NODE_BIN + ":" + os.environ["PATH"]
    os.environ["PUPPETEER_SKIP_DOWNLOAD"] = "1"
    with (BASE / "deploy.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("ReSingLab deployment already running.")
            return
        if not acquire_shared_lock(args.allow_lock_owner):
            return
        try:
            for target in {readlink(PRODUCTION), readlink(STAGE)} - {None}:
                if target.parent == RELEASES:
                    prune_compatibility(target)
            if args.rollback:
                target = readlink(BASE / "previous")
                if not target:
                    raise RuntimeError("No previous owned production release")
                set_hold("Manual rollback; automatic publishing paused until --resume.",
                         json.loads((target / "release.json").read_text())["commit"])
                activate(target, allow_legacy_rollback=True)
                return
            if args.activate:
                target = readlink(STAGE)
                if not target:
                    raise RuntimeError("No verified stage release")
                activate(target)
                return
            if args.resume:
                (BASE / "publish.hold.json").unlink(missing_ok=True)
            if (BASE / "publish.hold.json").exists() and not args.stage_only:
                print("Automatic publishing is held after rollback. Use --resume deliberately.")
                return
            if not SOURCE.exists():
                run(["git", "clone", REPO, SOURCE])
            origin = run(["git", "-C", SOURCE, "remote", "get-url", "origin"], capture_output=True, text=True).stdout.strip()
            if origin != REPO:
                raise RuntimeError("Unexpected deployment repository")
            if run(["git", "-C", SOURCE, "status", "--porcelain"], capture_output=True, text=True).stdout.strip():
                raise RuntimeError("Deployment source has local changes; inspect rather than overwrite")
            run(["git", "-C", SOURCE, "fetch", "origin", "main"])
            sha = run(["git", "-C", SOURCE, "rev-parse", "origin/main"], capture_output=True, text=True).stdout.strip()
            if not re.fullmatch("[0-9a-f]{40}", sha):
                raise RuntimeError("Invalid commit")
            current = readlink(PRODUCTION if (BASE / "production.enabled").exists() and not args.stage_only else STAGE)
            if current and (current / "release.json").exists() and json.loads((current / "release.json").read_text()).get("commit") == sha:
                print("Already current: " + sha)
                return
            run(["git", "-C", SOURCE, "checkout", "--detach", sha])
            run(["bun", "install", "--frozen-lockfile", "--ignore-scripts"], cwd=SOURCE)
            run(["node", "node_modules/typescript/bin/tsc", "-p", "tsconfig.app.json", "--noEmit"], cwd=SOURCE)
            run(["bun", "run", "test"], cwd=SOURCE)
            run(["bun", "run", "build"], cwd=SOURCE)
            verify(SOURCE / "dist")
            target = RELEASES / (now_utc().strftime("%Y%m%dT%H%M%SZ") + "-" + sha[:12])
            shutil.copytree(SOURCE / "dist", target)
            save_json(target / MANIFEST, {"version": 1, "commit": sha,
                      "current_assets": asset_hashes(target), "compatibility": {}})
            add_compatibility(target)
            save_json(target / "release.json", {"commit": sha, "hosting": "Hostinger",
                      "built_at": now_utc().isoformat()})
            verify(target)
            stage(target)
            print("Verified staging release: " + sha)
            if (BASE / "production.enabled").exists() and not args.stage_only:
                activate(target)
        finally:
            release_shared_lock()


if __name__ == "__main__":
    main()
