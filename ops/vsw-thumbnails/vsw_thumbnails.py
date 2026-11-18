#!/usr/bin/env python3
"""Keep a durable thumbnail for every VideoSayWhat video transcript.

For each videosaywhat.transcriptions row with a source_video_id but no thumbnail_url (or an
intake job that links a video id), copy the YouTube thumbnail into SWADEBASE storage bucket
`vsw-thumbnails/<video_id>.jpg` and store the public URL. Storage is backed up nightly to Backblaze.

Runs from cron on the swadesoul VPS (see README.md). Idempotent; safe to re-run.
Secrets are read from /opt/swadebase/docker/.env on the server — never committed.
"""
import json, subprocess, sys, urllib.request, urllib.error

ENV = '/opt/swadebase/docker/.env'
BASE = 'https://swadebase.cloud'
BUCKET = 'vsw-thumbnails'


def env(key):
    for line in open(ENV):
        if line.startswith(key + '='):
            return line.split('=', 1)[1].strip().strip('"')
    raise SystemExit(f'{key} missing in {ENV}')


def psql(sql):
    out = subprocess.run(['docker', 'exec', '-i', 'supabase-db', 'psql', '-U', 'postgres', '-d', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1'],
                         input=sql, capture_output=True, text=True, check=True)
    return out.stdout


def fetch_thumb(vid):
    for name in ('maxresdefault.jpg', 'hqdefault.jpg', 'mqdefault.jpg'):
        try:
            with urllib.request.urlopen(f'https://i.ytimg.com/vi/{vid}/{name}', timeout=20) as r:
                data = r.read()
                # YouTube returns a tiny grey placeholder for missing maxres; skip anything that small.
                if len(data) > 2000:
                    return data
        except urllib.error.HTTPError:
            continue
    return None


def upload(key, vid, data):
    req = urllib.request.Request(f'{BASE}/storage/v1/object/{BUCKET}/{vid}.jpg', data=data, method='POST',
                                 headers={'Authorization': f'Bearer {key}', 'apikey': key,
                                          'Content-Type': 'image/jpeg', 'x-upsert': 'true'})
    with urllib.request.urlopen(req, timeout=30) as r:
        r.read()
    return f'{BASE}/storage/v1/object/public/{BUCKET}/{vid}.jpg'


def main():
    key = env('SERVICE_ROLE_KEY')
    # Link any new intake-job video ids first.
    psql("""update videosaywhat.transcriptions t set source_video_id = j.video_id
      from (select distinct on (transcript_id) transcript_id, video_id from videosaywhat.youtube_intake_jobs
            where transcript_id is not null and video_id is not null order by transcript_id, created_at desc) j
      where j.transcript_id = t.id and t.source_video_id is null;""")
    vids = [v for v in psql("select distinct source_video_id from videosaywhat.transcriptions "
                            "where source_video_id is not null and thumbnail_url is null").split() if v]
    ok = fail = 0
    for vid in vids:
        if not all(c.isalnum() or c in '-_' for c in vid) or len(vid) != 11:
            continue
        data = fetch_thumb(vid)
        if not data:
            fail += 1
            continue
        try:
            url = upload(key, vid, data)
        except Exception as e:  # keep going; next run retries
            print(f'upload failed {vid}: {e}', file=sys.stderr)
            fail += 1
            continue
        psql(f"update videosaywhat.transcriptions set thumbnail_url = '{url}' "
             f"where source_video_id = '{vid}' and thumbnail_url is null;")
        ok += 1
    print(json.dumps({'candidates': len(vids), 'saved': ok, 'unavailable': fail}))


if __name__ == '__main__':
    main()
