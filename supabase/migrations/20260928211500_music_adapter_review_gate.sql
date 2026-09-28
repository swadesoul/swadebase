-- Human review gate for trained music adapters.
-- Quality approval and commercial-use approval are intentionally separate.

begin;

create table if not exists public.music_adapter_reviews (
  id uuid primary key default gen_random_uuid(),
  adapter_id uuid not null references public.music_model_adapters(id) on delete cascade,
  owner_user_id uuid not null,
  reviewer_user_id uuid,
  decision text not null check (decision in ('approved','rejected')),
  commercial_use_approved boolean not null default false,
  scores jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_music_adapter_reviews_adapter
  on public.music_adapter_reviews(adapter_id, created_at desc);
create index if not exists idx_music_adapter_reviews_owner
  on public.music_adapter_reviews(owner_user_id, created_at desc);

alter table public.music_adapter_reviews enable row level security;

revoke all on public.music_adapter_reviews from anon;
grant select on public.music_adapter_reviews to authenticated;
grant all on public.music_adapter_reviews to service_role;

drop policy if exists music_adapter_reviews_owner_select
  on public.music_adapter_reviews;
create policy music_adapter_reviews_owner_select
on public.music_adapter_reviews
for select to authenticated
using ((select auth.uid()) = owner_user_id);

create or replace function public.review_music_model_adapter(
  p_adapter_id uuid,
  p_decision text,
  p_reviewer_user_id uuid default null,
  p_scores jsonb default '{}'::jsonb,
  p_notes text default null,
  p_commercial_use_approved boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.music_model_adapters%rowtype;
  r_id uuid;
  model_commercial_status text;
  next_status text;
begin
  if p_decision not in ('approved','rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  select * into a
  from public.music_model_adapters
  where id = p_adapter_id
  for update;

  if not found then
    raise exception 'music adapter not found';
  end if;

  if a.status in ('revoked','archived') then
    raise exception 'adapter cannot be reviewed from status %', a.status;
  end if;

  if p_commercial_use_approved and p_decision <> 'approved' then
    raise exception 'commercial use cannot be approved for a rejected adapter';
  end if;

  if p_commercial_use_approved then
    select mr.commercial_status
      into model_commercial_status
    from public.music_model_registry mr
    where mr.repo_id = a.base_model
      and mr.revision = a.base_revision
      and mr.model_role = 'training_base'
    order by mr.updated_at desc
    limit 1;

    if coalesce(model_commercial_status, 'review_required') <> 'approved' then
      raise exception 'base model commercial status is %, not approved',
        coalesce(model_commercial_status, 'review_required');
    end if;
  end if;

  next_status := case when p_decision = 'approved' then 'ready' else 'rejected' end;

  update public.music_model_adapters
  set
    status = next_status,
    commercial_use_approved =
      case when p_decision = 'approved' then p_commercial_use_approved else false end,
    approved_at =
      case when p_decision = 'approved' then now() else null end
  where id = p_adapter_id;

  insert into public.music_adapter_reviews (
    adapter_id,
    owner_user_id,
    reviewer_user_id,
    decision,
    commercial_use_approved,
    scores,
    notes
  )
  values (
    a.id,
    a.owner_user_id,
    p_reviewer_user_id,
    p_decision,
    case when p_decision = 'approved' then p_commercial_use_approved else false end,
    coalesce(p_scores, '{}'::jsonb),
    p_notes
  )
  returning id into r_id;

  return jsonb_build_object(
    'adapter_id', a.id,
    'review_id', r_id,
    'status', next_status,
    'commercial_use_approved',
      case when p_decision = 'approved' then p_commercial_use_approved else false end
  );
end;
$$;

revoke all on function public.review_music_model_adapter(uuid,text,uuid,jsonb,text,boolean)
  from public, anon, authenticated;
grant execute on function public.review_music_model_adapter(uuid,text,uuid,jsonb,text,boolean)
  to service_role;

commit;
