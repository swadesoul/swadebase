#!/usr/bin/env python3
"""Repo Scout fetcher (SWADEBASE). Finds new videos on watched YouTube channels and saves
free auto-caption transcripts. Reuses the VideoSayWhat yt-dlp venv + vsw-warp SOCKS proxy.
No paid transcription, no AI calls, no secrets. Prints one JSON line per new transcript.
Usage: fetch.py [--max N] [--mark-seen-only]
"""
import json, re, subprocess, sys, urllib.request, pathlib, datetime

BASE = pathlib.Path("/opt/swadebase-adapters/var/repo-scout")
TRANSCRIPTS = BASE / "transcripts"
SEEN = BASE / "seen.txt"
CHANNELS = BASE / "channels.txt"   # one "@handle" per line
YTDLP = "/opt/vsw-audio-extractor/venv/bin/yt-dlp"
PROXY = "socks5h://127.0.0.1:41080"
UA = {"User-Agent": "Mozilla/5.0"}

def list_videos(handle):
    req = urllib.request.Request(f"https://www.youtube.com/{handle}/videos", headers=UA)
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    ids = []
    for v in re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', html):
        if v not in ids:
            ids.append(v)
    return ids[:15]

def clean_vtt(path):
    out, seen = [], set()
    for line in path.read_text(errors="ignore").splitlines():
        if not line.strip() or "-->" in line or line.startswith(("WEBVTT", "Kind:", "Language:")):
            continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        if line and line not in seen:
            seen.add(line); out.append(line)
    return " ".join(out)

def fetch(vid):
    work = BASE / "work"; work.mkdir(parents=True, exist_ok=True)
    r = subprocess.run([YTDLP, "--proxy", PROXY, "--skip-download", "--write-auto-subs", "--write-subs",
                        "--sub-langs", "en-orig,en", "--sub-format", "vtt", "--no-simulate",
                        "--print", "%(id)s|%(upload_date)s|%(channel)s|%(title)s",
                        "-o", str(work / "%(id)s.%(ext)s"), f"https://www.youtube.com/watch?v={vid}"],
                       capture_output=True, text=True, timeout=240)
    meta = (r.stdout.strip().splitlines() or [""])[0].split("|", 3)
    vtts = sorted(work.glob(f"{vid}*.vtt"), key=lambda p: ("en-orig" not in p.name, p.name))
    if not vtts:
        return None, (r.stderr.strip().splitlines() or ["no captions"])[-1]
    text = clean_vtt(vtts[0])
    for p in work.glob(f"{vid}*"):
        p.unlink()
    TRANSCRIPTS.mkdir(parents=True, exist_ok=True)
    rec = {"id": vid, "upload_date": meta[1] if len(meta) > 1 else "", "channel": meta[2] if len(meta) > 2 else "",
           "title": meta[3] if len(meta) > 3 else "", "url": f"https://www.youtube.com/watch?v={vid}",
           "words": len(text.split()), "fetched_at": datetime.datetime.utcnow().isoformat() + "Z"}
    out = TRANSCRIPTS / f"{rec['upload_date']}_{vid}.txt"
    out.write_text(json.dumps(rec) + "\n\n" + text)
    rec["file"] = str(out)
    return rec, None

def main():
    max_n = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 3
    mark_only = "--mark-seen-only" in sys.argv
    BASE.mkdir(parents=True, exist_ok=True)
    seen = set(SEEN.read_text().split()) if SEEN.exists() else set()
    handles = [h.strip() for h in CHANNELS.read_text().splitlines() if h.strip() and not h.startswith("#")]
    for h in handles:
        try:
            ids = list_videos(h)
        except Exception as e:
            print(json.dumps({"channel": h, "error": f"list failed: {e}"})); continue
        new = [v for v in ids if v not in seen][:max_n]
        for vid in new:
            if mark_only:
                rec, err = {"id": vid, "marked_seen": True}, None
            else:
                rec, err = fetch(vid)
            if err:
                print(json.dumps({"channel": h, "id": vid, "error": err})); continue
            seen.add(vid)
            with SEEN.open("a") as f:
                f.write(vid + "\n")
            print(json.dumps(rec))

if __name__ == "__main__":
    main()
