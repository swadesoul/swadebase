-- Paid Payment Link fulfillment (ReSing, VideoSayWhat, Abagale Founding Pass, Black Tales listing)
-- 2026-11-24. Applied by Bizzy Bill. Rollback: 20261124120000_paid_link_fulfillment.down.sql
begin;

create table if not exists swadebase_ops.paid_signup_grants (
  email text primary key,
  app text not null,
  ref text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 hour',
  claimed_at timestamptz
);
alter table swadebase_ops.paid_signup_grants enable row level security;
revoke all on swadebase_ops.paid_signup_grants from public, anon, authenticated;

-- Returns the existing auth user id for an email, or NULL after writing a signup grant
-- so the caller (service role only) can create the account through GoTrue.
create or replace function swadebase_ops.paid_buyer_prepare(p_email text, p_app text, p_ref text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid;
begin
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email'; end if;
  select u.id into v_id from auth.users u where lower(u.email) = v_email order by u.created_at limit 1;
  if v_id is not null then return v_id; end if;
  insert into swadebase_ops.paid_signup_grants(email, app, ref) values (v_email, p_app, p_ref)
  on conflict (email) do update set app = excluded.app, ref = excluded.ref,
    expires_at = now() + interval '1 hour', claimed_at = null;
  return null;
end $$;
revoke all on function swadebase_ops.paid_buyer_prepare(text, text, text) from public, anon, authenticated;
grant execute on function swadebase_ops.paid_buyer_prepare(text, text, text) to service_role;

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

  -- Paid Payment Link buyers (2026-11-24, Abagale-approved automatic fulfillment): a verified Stripe
  -- webhook writes a short-lived, single-email grant before creating the buyer's account.
  IF EXISTS (SELECT 1 FROM swadebase_ops.paid_signup_grants g
             WHERE g.email = lower(coalesce(NEW.email, ''))
               AND g.claimed_at IS NULL AND g.expires_at > now()) THEN
    UPDATE swadebase_ops.paid_signup_grants SET claimed_at = now() WHERE email = lower(NEW.email);
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


-- resinglab: buyer lookup wrapper + fulfillment ledger
create or replace function resinglab.paid_buyer_prepare(p_email text, p_ref text)
returns uuid language sql security definer set search_path = '' as $$
  select swadebase_ops.paid_buyer_prepare(p_email, 'resinglab', p_ref)
$$;
revoke all on function resinglab.paid_buyer_prepare(text, text) from public, anon, authenticated;
grant execute on function resinglab.paid_buyer_prepare(text, text) to service_role;

create table if not exists resinglab.paid_fulfillments (
  fulfillment_key text primary key,
  offer text not null,
  email text,
  user_id uuid,
  stripe_event_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'processing',
  attempts integer not null default 1,
  email_sent_at timestamptz,
  email_error text,
  last_error text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paid_fulfillments_sub_idx on resinglab.paid_fulfillments(stripe_subscription_id);
alter table resinglab.paid_fulfillments enable row level security;
revoke all on resinglab.paid_fulfillments from public, anon, authenticated;
grant all on resinglab.paid_fulfillments to service_role;

-- videosaywhat: buyer lookup wrapper + fulfillment ledger
create or replace function videosaywhat.paid_buyer_prepare(p_email text, p_ref text)
returns uuid language sql security definer set search_path = '' as $$
  select swadebase_ops.paid_buyer_prepare(p_email, 'videosaywhat', p_ref)
$$;
revoke all on function videosaywhat.paid_buyer_prepare(text, text) from public, anon, authenticated;
grant execute on function videosaywhat.paid_buyer_prepare(text, text) to service_role;

create table if not exists videosaywhat.paid_fulfillments (
  fulfillment_key text primary key,
  offer text not null,
  email text,
  user_id uuid,
  stripe_event_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'processing',
  attempts integer not null default 1,
  email_sent_at timestamptz,
  email_error text,
  last_error text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paid_fulfillments_sub_idx on videosaywhat.paid_fulfillments(stripe_subscription_id);
alter table videosaywhat.paid_fulfillments enable row level security;
revoke all on videosaywhat.paid_fulfillments from public, anon, authenticated;
grant all on videosaywhat.paid_fulfillments to service_role;

-- abagale: buyer lookup wrapper + fulfillment ledger
create or replace function abagale.paid_buyer_prepare(p_email text, p_ref text)
returns uuid language sql security definer set search_path = '' as $$
  select swadebase_ops.paid_buyer_prepare(p_email, 'abagale', p_ref)
$$;
revoke all on function abagale.paid_buyer_prepare(text, text) from public, anon, authenticated;
grant execute on function abagale.paid_buyer_prepare(text, text) to service_role;

create table if not exists abagale.paid_fulfillments (
  fulfillment_key text primary key,
  offer text not null,
  email text,
  user_id uuid,
  stripe_event_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'processing',
  attempts integer not null default 1,
  email_sent_at timestamptz,
  email_error text,
  last_error text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paid_fulfillments_sub_idx on abagale.paid_fulfillments(stripe_subscription_id);
alter table abagale.paid_fulfillments enable row level security;
revoke all on abagale.paid_fulfillments from public, anon, authenticated;
grant all on abagale.paid_fulfillments to service_role;

-- blacktales: buyer lookup wrapper + fulfillment ledger
create or replace function blacktales.paid_buyer_prepare(p_email text, p_ref text)
returns uuid language sql security definer set search_path = '' as $$
  select swadebase_ops.paid_buyer_prepare(p_email, 'blacktales', p_ref)
$$;
revoke all on function blacktales.paid_buyer_prepare(text, text) from public, anon, authenticated;
grant execute on function blacktales.paid_buyer_prepare(text, text) to service_role;

create table if not exists blacktales.paid_fulfillments (
  fulfillment_key text primary key,
  offer text not null,
  email text,
  user_id uuid,
  stripe_event_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'processing',
  attempts integer not null default 1,
  email_sent_at timestamptz,
  email_error text,
  last_error text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paid_fulfillments_sub_idx on blacktales.paid_fulfillments(stripe_subscription_id);
alter table blacktales.paid_fulfillments enable row level security;
revoke all on blacktales.paid_fulfillments from public, anon, authenticated;
grant all on blacktales.paid_fulfillments to service_role;

-- Abagale TV 2027 Founding Pass: numbered passes
create sequence if not exists abagale.founding_pass_number_seq start 1;
create table if not exists abagale.founding_passes (
  id uuid primary key default gen_random_uuid(),
  pass_number integer not null unique default nextval('abagale.founding_pass_number_seq'),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  credit_name text,
  status text not null default 'active',
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_total integer,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter sequence abagale.founding_pass_number_seq owned by abagale.founding_passes.pass_number;
alter table abagale.founding_passes enable row level security;
drop policy if exists "Owners read their founding pass" on abagale.founding_passes;
create policy "Owners read their founding pass" on abagale.founding_passes for select to authenticated using (user_id = auth.uid());
revoke all on abagale.founding_passes from anon;
grant select on abagale.founding_passes to authenticated;
grant all on abagale.founding_passes to service_role;
grant usage, select on sequence abagale.founding_pass_number_seq to service_role;

-- Black Tales Film Listing: prepaid listing credits (one listing-year per paid year)
create table if not exists blacktales.listing_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  credits integer not null default 1,
  credits_used integer not null default 0,
  film_id uuid,
  status text not null default 'active',
  period_end timestamptz,
  stripe_subscription_id text,
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listing_credits_user_idx on blacktales.listing_credits(user_id);
create index if not exists listing_credits_sub_idx on blacktales.listing_credits(stripe_subscription_id);
alter table blacktales.listing_credits enable row level security;
drop policy if exists "Owners read their listing credits" on blacktales.listing_credits;
create policy "Owners read their listing credits" on blacktales.listing_credits for select to authenticated using (user_id = auth.uid());
revoke all on blacktales.listing_credits from anon;
grant select on blacktales.listing_credits to authenticated;
grant all on blacktales.listing_credits to service_role;

commit;
notify pgrst, 'reload schema';
