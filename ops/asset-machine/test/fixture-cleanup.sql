-- Test-only capability: refuses real identities and only removes marked synthetic fixtures.
create or replace function swadebase_ops.cleanup_asset_machine_fixture(test_tag text) returns void
language plpgsql security definer set search_path='' as $$
declare ids uuid[]; case_ids uuid[];
begin
 if test_tag !~ '^[0-9a-f]{8}$' then raise exception 'Invalid fixture tag'; end if;
 select array_agg(m.user_id) into ids from swadebase_ops.machine_members m
 where m.email in ('asset-test-client-'||test_tag||'@example.invalid','asset-test-other-'||test_tag||'@example.invalid','asset-test-reviewer-'||test_tag||'@example.invalid')
 and not exists(select 1 from auth.users u where u.id=m.user_id);
 select array_agg(c.id) into case_ids from swadebase_ops.machine_cases c
 where c.title='SYNTHETIC TEST ONLY - '||test_tag and c.owner_id=any(select x::text from unnest(ids) x);
 delete from swadebase_ops.machine_events where case_id=any(case_ids);
 delete from swadebase_ops.machine_messages where case_id=any(case_ids);
 delete from swadebase_ops.machine_contacts where case_id=any(case_ids);
 delete from swadebase_ops.machine_reports where case_id=any(case_ids);
 delete from swadebase_ops.machine_reviews where case_id=any(case_ids);
 delete from swadebase_ops.machine_findings where case_id=any(case_ids);
 delete from swadebase_ops.machine_evidence where case_id=any(case_ids);
 delete from swadebase_ops.machine_cases where id=any(case_ids);
 delete from swadebase_ops.machine_sessions s where s.email in ('asset-test-owner-'||test_tag||'@example.invalid','asset-test-client-'||test_tag||'@example.invalid','asset-test-other-'||test_tag||'@example.invalid','asset-test-reviewer-'||test_tag||'@example.invalid') and not exists(select 1 from auth.users u where u.id=s.user_id);
 delete from swadebase_ops.machine_members m where m.user_id=any(ids);
end $$;
revoke all on function swadebase_ops.cleanup_asset_machine_fixture(text) from public;
grant execute on function swadebase_ops.cleanup_asset_machine_fixture(text) to swadebase_adapters;
