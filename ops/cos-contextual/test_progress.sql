BEGIN;
DO $$
DECLARE test_user uuid; sites int; before_count int; after_count int;
BEGIN
 SELECT id INTO test_user FROM auth.users LIMIT 1;
 IF test_user IS NULL THEN RAISE EXCEPTION 'No test identity'; END IF;
 SELECT count(*) INTO before_count FROM swadesoul.cos_onboarding_progress WHERE user_id=test_user AND site_slug='maestroradio';
 IF before_count<>0 THEN RAISE NOTICE 'User already has onboarding; testing alternate isolated site key'; END IF;
 INSERT INTO swadesoul.cos_onboarding_progress(user_id,site_slug,category,status) VALUES(test_user,'cos-disposable-test','artist','skipped');
 INSERT INTO swadesoul.cos_onboarding_progress(user_id,site_slug,category,status) VALUES(test_user,'cos-disposable-test','artist','completed') ON CONFLICT(user_id,site_slug) DO NOTHING;
 SELECT count(*) INTO after_count FROM swadesoul.cos_onboarding_progress WHERE user_id=test_user AND site_slug='cos-disposable-test' AND status='skipped';
 IF after_count<>1 THEN RAISE EXCEPTION 'One-time skip persisted incorrectly'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='swadesoul' AND tablename='cos_onboarding_progress' AND indexname='cos_onboarding_progress_pkey') THEN RAISE EXCEPTION 'Missing unique onboarding key'; END IF;
 RAISE NOTICE 'PASS: one user/site completion, repeated finish cannot overwrite skip';
END $$;
ROLLBACK;
