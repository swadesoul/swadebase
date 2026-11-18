-- Library thumbnails: keep a durable thumbnail for every video transcript.
-- Additive only. Applied on SWADEBASE (videosaywhat schema). Images are copied into SWADEBASE storage
-- bucket `vsw-thumbnails` by ops/vsw-thumbnails/vsw_thumbnails.py (nightly-backed-up to Backblaze).

alter table videosaywhat.transcriptions add column if not exists source_video_id text;
alter table videosaywhat.transcriptions add column if not exists thumbnail_url text;

-- Pull a YouTube video id out of a file name like "Y4sPJZfsVWc?si=..." or "...watch?v=ID" / "youtu.be/ID".
create or replace function videosaywhat.vsw_youtube_id_from_text(t text)
returns text language sql immutable as $$
  select coalesce(
    substring(t from '(?:v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_-]{11})'),
    substring(t from '^([A-Za-z0-9_-]{11})(?:\?|\s|$)')
  )
$$;

-- Fill source_video_id on insert/update when it can be read from the file name.
create or replace function videosaywhat.vsw_set_source_video_id()
returns trigger language plpgsql as $$
begin
  if new.source_video_id is null then
    new.source_video_id := videosaywhat.vsw_youtube_id_from_text(new.file_name);
  end if;
  return new;
end $$;

drop trigger if exists vsw_set_source_video_id on videosaywhat.transcriptions;
create trigger vsw_set_source_video_id before insert or update of file_name on videosaywhat.transcriptions
  for each row execute function videosaywhat.vsw_set_source_video_id();

-- Backfill: intake jobs first (authoritative), then file names.
update videosaywhat.transcriptions t set source_video_id = j.video_id
from (select distinct on (transcript_id) transcript_id, video_id from videosaywhat.youtube_intake_jobs
      where transcript_id is not null and video_id is not null order by transcript_id, created_at desc) j
where j.transcript_id = t.id and t.source_video_id is null;

update videosaywhat.transcriptions set source_video_id = videosaywhat.vsw_youtube_id_from_text(file_name)
where source_video_id is null and videosaywhat.vsw_youtube_id_from_text(file_name) is not null;

-- Public read bucket for thumbnails (images only).
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('vsw-thumbnails', 'vsw-thumbnails', true, array['image/jpeg','image/webp','image/png'])
on conflict (id) do nothing;
