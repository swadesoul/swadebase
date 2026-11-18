BEGIN;
ALTER TABLE swadebase_ops.swade_bots_profiles
  DROP CONSTRAINT IF EXISTS swade_bots_profiles_state_check;
ALTER TABLE swadebase_ops.swade_bots_profiles
  ADD CONSTRAINT swade_bots_profiles_state_check CHECK(state IN ('draft','paused','chat_ready'));
CREATE INDEX IF NOT EXISTS swade_bots_messages_recent
  ON swadebase_ops.swade_bots_messages(bot_id,owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS swade_bots_knowledge_recent
  ON swadebase_ops.swade_bots_knowledge(bot_id,owner_id,created_at DESC);
COMMIT;
