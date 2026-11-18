-- Maestro Live DJ backstage v1: server-only invite and room state, no live broadcast access.
BEGIN;
CREATE TABLE IF NOT EXISTS maestroradio.live_dj_backstage_rooms (
 id uuid primary key default gen_random_uuid(),
 station_id uuid not null references maestroradio.stations(id) on delete cascade,
 host_user_id uuid not null references auth.users(id) on delete cascade,
 live_dj_account_id uuid references maestroradio.live_dj_accounts(id) on delete set null,
 room_name text not null unique check(length(room_name) between 20 and 100),
 status text not null default 'rehearsal' check(status in ('rehearsal','ended')),
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 ended_at timestamptz,
 constraint backstage_room_max_duration check(expires_at <= created_at+interval '4 hours')
);
CREATE UNIQUE INDEX IF NOT EXISTS backstage_one_active_host ON maestroradio.live_dj_backstage_rooms(station_id,host_user_id)
  WHERE status='rehearsal';
CREATE INDEX IF NOT EXISTS backstage_rooms_expiry ON maestroradio.live_dj_backstage_rooms(expires_at) WHERE status='rehearsal';
CREATE TABLE IF NOT EXISTS maestroradio.live_dj_guest_invites (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references maestroradio.live_dj_backstage_rooms(id) on delete cascade,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 invited_name text not null check(char_length(invited_name) between 1 and 80),
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 consumed_at timestamptz,
 revoked_at timestamptz,
 invited_by uuid not null references auth.users(id),
 constraint guest_invite_short_ttl check(expires_at<=created_at+interval '20 minutes')
);
CREATE INDEX IF NOT EXISTS guest_invites_room ON maestroradio.live_dj_guest_invites(room_id,created_at desc);
CREATE TABLE IF NOT EXISTS maestroradio.live_dj_backstage_events (
 id bigint generated always as identity primary key,
 room_id uuid references maestroradio.live_dj_backstage_rooms(id) on delete set null,
 station_id uuid not null references maestroradio.stations(id) on delete cascade,
 actor_id uuid,
 event text not null check(event in ('create_room','invite','redeem','revoke_invite','end_room','join_host')),
 occurred_at timestamptz not null default now(),
 detail jsonb not null default '{}'::jsonb
);
CREATE OR REPLACE FUNCTION maestroradio.redeem_live_dj_guest_invite(p_token_hash text)
RETURNS TABLE (room_name text, invited_name text, station_id uuid, room_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = maestroradio,public AS $$
DECLARE found_record record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN; END IF;
 UPDATE maestroradio.live_dj_guest_invites i
 SET consumed_at=now()
 FROM maestroradio.live_dj_backstage_rooms r
 WHERE i.token_hash=p_token_hash AND i.room_id=r.id AND i.consumed_at IS NULL
   AND i.revoked_at IS NULL AND i.expires_at>now()
   AND r.status='rehearsal' AND r.expires_at>now()
 RETURNING r.room_name,i.invited_name,r.station_id,r.id INTO found_record;
 IF NOT FOUND THEN RETURN; END IF;
 INSERT INTO maestroradio.live_dj_backstage_events(room_id,station_id,event,detail)
 VALUES(found_record.id,found_record.station_id,'redeem','{}'::jsonb);
 room_name:=found_record.room_name;
 invited_name:=found_record.invited_name;
 station_id:=found_record.station_id;
 room_id:=found_record.id;
 RETURN NEXT;
END $$;
REVOKE ALL ON FUNCTION maestroradio.redeem_live_dj_guest_invite(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION maestroradio.redeem_live_dj_guest_invite(text) TO service_role;
ALTER TABLE maestroradio.live_dj_backstage_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestroradio.live_dj_guest_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestroradio.live_dj_backstage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON maestroradio.live_dj_backstage_rooms,maestroradio.live_dj_guest_invites,maestroradio.live_dj_backstage_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON maestroradio.live_dj_backstage_rooms,maestroradio.live_dj_guest_invites,maestroradio.live_dj_backstage_events TO service_role;
COMMIT;
