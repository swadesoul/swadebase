-- Transcript Intelligence: saved Ask-drawer answers (docs/PRD-transcript-intelligence.md §4.3)
create table if not exists public.transcript_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript_id text not null,
  kind text not null default 'chat',
  question text,
  answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists transcript_notes_user_transcript_idx
  on public.transcript_notes (user_id, transcript_id, created_at desc);

alter table public.transcript_notes enable row level security;

drop policy if exists "transcript_notes_select_own" on public.transcript_notes;
create policy "transcript_notes_select_own" on public.transcript_notes
  for select using (auth.uid() = user_id);

drop policy if exists "transcript_notes_insert_own" on public.transcript_notes;
create policy "transcript_notes_insert_own" on public.transcript_notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "transcript_notes_delete_own" on public.transcript_notes;
create policy "transcript_notes_delete_own" on public.transcript_notes
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.transcript_notes to authenticated;
