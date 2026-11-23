#!/usr/bin/env python3
"""Verify actual release files and explicitly expiring legacy compatibility assets."""
import datetime as dt
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import urlsplit

MARKERS = re.compile(r"lovable[.](?:app|dev)|__l5e|lovable-badge", re.I)
REFERENCES = re.compile(r"""["'(]((?:/?assets/|\.\.?/)[^"'()<>\s]+?\.(?:m?js|css))(?:[?#][^"'()<>\s]*)?["')]""")


def utc_time(value):
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=dt.timezone.utc) if parsed.tzinfo is None else parsed.astimezone(dt.timezone.utc)


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def asset_hashes(root):
    assets = {}
    for path in sorted((root / "assets").rglob("*")):
        require(not path.is_symlink(), "Symlink in release assets")
        if path.is_file():
            assets[path.relative_to(root).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return assets


def safe_asset(name):
    return (isinstance(name, str) and name.startswith("assets/") and "\\" not in name
            and ".." not in PurePosixPath(name).parts and str(PurePosixPath(name)) == name)


def verify(root, now=None):
    root = Path(root)
    now = now or dt.datetime.now(dt.timezone.utc)
    require((root / "index.html").is_file(), "Missing build HTML")
    html = (root / "index.html").read_text()
    actual = asset_hashes(root)
    require(bool(actual), "Missing build assets")
    manifest_path = root / "assets-manifest.json"
    current, compatibility = actual, {}
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text())
        require(manifest.get("version") == 1 and re.fullmatch(r"[0-9a-f]{40}", manifest.get("commit", "")),
                "Invalid release asset manifest")
        current, compatibility = manifest["current_assets"], manifest["compatibility"]
        require(bool(current) and not (current.keys() & compatibility.keys()), "Ambiguous asset ownership")
        require(set(actual) == set(current) | set(compatibility), "Unrecorded or missing release asset")
        for name, digest in current.items():
            require(safe_asset(name) and actual.get(name) == digest, "Current asset checksum mismatch")
        for name, entry in compatibility.items():
            require(safe_asset(name) and actual.get(name) == entry["sha256"], "Compatibility checksum mismatch")
            require(entry["kind"] in ["previous-release", "migration-legacy"], "Unknown compatibility exception")
            require(re.fullmatch(r"[0-9a-f]{40}", entry["source_commit"]), "Unknown compatibility source")
            retired, expires = utc_time(entry["retired_at"]), utc_time(entry["expires_at"])
            require(retired <= now < expires <= retired + dt.timedelta(days=7),
                    "Expired or unbounded compatibility exception")

    entries = re.findall(r'(?:src|href)="(/assets/[^"]+)"', html)
    require(entries and all(urlsplit(p).path.lstrip("/") in current for p in entries),
            "Missing current entry assets or entry references legacy compatibility")
    # Check every current bundle, not only entry HTML, and disallow importing retired chunks.
    for name in ["index.html", *current]:
        path = root / name
        if path.suffix not in [".html", ".js", ".mjs", ".css"]:
            continue
        text = path.read_text()
        require(not MARKERS.search(text), "Retired provider runtime or branding in " + name)
        for reference in REFERENCES.findall(text):
            if reference.startswith(("/assets/", "assets/")):
                linked = reference.lstrip("/")
            else:
                linked = (path.parent / reference).resolve().relative_to(root.resolve()).as_posix()
            require(linked in current, "Current bundle references missing or retired asset: " + linked)
    for name, entry in compatibility.items():
        if entry["kind"] != "migration-legacy" and Path(name).suffix in [".js", ".mjs", ".css"]:
            require(not MARKERS.search((root / name).read_text()), "Unexpected provider marker in previous native release")

    manifest = json.loads((root / "manifest.json").read_text())
    require("resing" in manifest.get("name", "").lower(), "Unexpected manifest brand")
    require(bool(manifest.get("icons")), "Missing owned icons")
    for icon in manifest["icons"]:
        url = urlsplit(icon["src"])
        require(not url.scheme and not url.netloc and ".." not in PurePosixPath(url.path).parts,
                "Icon is not an owned asset")
        require((root / url.path.lstrip("/")).is_file(), "Missing owned icon")
    print("Verified actual release: " + str(len(current)) + " current assets; "
          + str(len(compatibility)) + " expiring compatibility assets; clean current runtime.")


if __name__ == "__main__":
    verify(Path(sys.argv[1] if len(sys.argv) > 1 else "dist"))
