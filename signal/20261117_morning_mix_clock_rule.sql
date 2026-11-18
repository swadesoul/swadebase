-- 2026-11-17 (Claude for Swade): "time/weather is 5-7 minutes behind our watches".
-- Live AI DJ breaks are exact since the 2026-11-11 cue fix (verified: cue-fixed breaks aired on the minute).
-- The Morning Mix renders whole episodes ahead and replays at 11 PM, so it must never bake in a clock time,
-- temperature, or "X minutes until" countdown. Those are rendered as short live drops just before air.
begin;
update swagents.agents set description = description ||
 ' CLOCK RULE (Swade, Nov 17 2026): never write or render a clock time, a temperature/weather reading, or a "minutes until" countdown into an episode. Mark those spots as live drops ({TIME_DROP}, {WEATHER_DROP}, {RICH_COUNTDOWN}); each drop is written from the real air moment and voiced about 2 minutes before it plays (same method as the AI DJ cue fixer), so it matches a listener''s watch. Countdowns are computed from Uncle Rich''s scheduled call slot, rounded to a natural phrase ("about ten minutes out"). The 11 PM replay and the Sunday Best Of get fresh drops for their own air time or none, never the morning''s.',
 updated_at = now(), updated_by = 'claude'
 where id = 'morning-mix' and description not like '%CLOCK RULE%';
commit;
