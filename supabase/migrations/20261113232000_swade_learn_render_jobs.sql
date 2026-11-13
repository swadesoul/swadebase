-- SWADE Learn production packs join the Motion Studio queue.
-- Not applied to production by this PR.

begin;

alter table public.motion_render_jobs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.motion_render_jobs add column if not exists result jsonb not null default '{}'::jsonb;

alter table public.motion_render_jobs drop constraint if exists motion_render_jobs_kind_check;
alter table public.motion_render_jobs add constraint motion_render_jobs_kind_check
  check (kind in ('compose', 'render', 'compose_render', 'style_sample', 'swade_learn'));

alter table public.motion_render_jobs drop constraint if exists motion_render_jobs_status_check;
alter table public.motion_render_jobs add constraint motion_render_jobs_status_check
  check (status in ('queued', 'running', 'done', 'failed', 'cancelled', 'spend_blocked'));

alter table public.motion_render_jobs drop constraint if exists motion_render_jobs_target_chk;
alter table public.motion_render_jobs add constraint motion_render_jobs_target_chk
  check (
    (kind = 'style_sample' and style_id is not null)
    or (kind = 'swade_learn' and payload ? 'pack')
    or (kind not in ('style_sample', 'swade_learn') and project_id is not null)
  );

create unique index if not exists uq_motion_swade_learn_pack_active
  on public.motion_render_jobs ((payload #>> '{pack,pack_id}'))
  where kind = 'swade_learn' and status in ('queued', 'running');

drop function if exists public.claim_motion_render_job(text);
create function public.claim_motion_render_job(p_worker_id text)
returns public.motion_render_jobs
language plpgsql
security definer
set search_path = public
as $$
declare j public.motion_render_jobs;
begin
  with reaped as (
    update public.motion_render_jobs
       set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
           error_message = coalesce(error_message, 'worker heartbeat lost'),
           completed_at = case when attempts >= max_attempts then now() else completed_at end
     where status = 'running' and heartbeat_at < now() - interval '10 minutes'
     returning id, kind, project_id, style_id, status
  ), failed_projects as (
    update public.motion_projects p
       set status = 'failed', error_message = 'The render worker stopped responding. Try again.'
      from reaped r
     where r.status = 'failed' and r.kind not in ('style_sample', 'swade_learn') and p.id = r.project_id
     returning p.id
  )
  update public.motion_styles s
     set sample_status = 'failed'
    from reaped r
   where r.status = 'failed' and r.kind = 'style_sample' and s.id = r.style_id;

  select * into j from public.motion_render_jobs
   where status = 'queued'
   order by queued_at
   limit 1
   for update skip locked;
  if not found then return null; end if;

  update public.motion_render_jobs
     set status = 'running', worker_id = p_worker_id, attempts = attempts + 1,
         started_at = now(), heartbeat_at = now()
   where id = j.id
   returning * into j;
  return j;
end $$;
revoke all on function public.claim_motion_render_job(text) from public, anon, authenticated;
grant execute on function public.claim_motion_render_job(text) to service_role;

commit;
