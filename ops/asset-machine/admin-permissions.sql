begin;
alter table swadebase_ops.machine_members add column if not exists can_invite boolean not null default false;
alter table swadebase_ops.machine_members add column if not exists payment_exempt boolean not null default false;
commit;
