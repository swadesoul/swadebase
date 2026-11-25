-- Rollback for 20261124120000_paid_link_fulfillment.sql
begin;
CREATE OR REPLACE FUNCTION sssbrain.enforce_invite_only_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'sssbrain', 'public', 'auth'
AS $function$
DECLARE
  v_code text;
  v_ok boolean;
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'swadesoul@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- ATTOBAHN staff pre-approval (owner-approved, single use, expiring).
  IF EXISTS (SELECT 1 FROM attobahn.staff_preapprovals p
             WHERE p.email = lower(coalesce(NEW.email, ''))
               AND p.claimed_at IS NULL AND p.expires_at > now()) THEN
    RETURN NEW;
  END IF;

  -- GhostRep: approved waitlist members, invitees, admins and gifted/paid emails (owner-approved 2026-11-11).
  IF ghostrep.signup_allowed(NEW.email) THEN
    RETURN NEW;
  END IF;

  v_code := nullif(trim(coalesce(NEW.raw_user_meta_data->>'invite_code', '')), '');
  IF v_code IS NULL THEN
    RAISE EXCEPTION 'invite_required: this site is invite-only. Ask the owner for an invite code.';
  END IF;

  SELECT true INTO v_ok
  FROM sssbrain.invite_codes
  WHERE code = v_code
    AND NOT revoked
    AND (expires_at IS NULL OR expires_at > now())
    AND uses < max_uses;

  IF NOT coalesce(v_ok, false) THEN
    RAISE EXCEPTION 'invite_invalid: that invite code is invalid, expired, or fully used.';
  END IF;

  UPDATE sssbrain.invite_codes
  SET uses = uses + 1
  WHERE code = v_code;

  RETURN NEW;
END;
$function$;
drop function if exists resinglab.paid_buyer_prepare(text, text);
-- keep resinglab.paid_fulfillments for audit; drop manually if wanted
drop function if exists videosaywhat.paid_buyer_prepare(text, text);
-- keep videosaywhat.paid_fulfillments for audit; drop manually if wanted
drop function if exists abagale.paid_buyer_prepare(text, text);
-- keep abagale.paid_fulfillments for audit; drop manually if wanted
drop function if exists blacktales.paid_buyer_prepare(text, text);
-- keep blacktales.paid_fulfillments for audit; drop manually if wanted
drop function if exists swadebase_ops.paid_buyer_prepare(text, text, text);
drop table if exists swadebase_ops.paid_signup_grants;
-- abagale.founding_passes and blacktales.listing_credits hold paid customer records: not dropped automatically.
commit;
notify pgrst, 'reload schema';
