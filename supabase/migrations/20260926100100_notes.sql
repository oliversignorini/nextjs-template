-- Demo resource: proves the full stack (RLS -> service -> API -> UI) end to end.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index notes_user_id_created_at_idx on public.notes (user_id, created_at desc);

-- Idempotency keys for POST /api/v1/notes (agents/clients may retry safely).
create table public.idempotency_keys (
  key text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  response jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
alter table public.idempotency_keys enable row level security;

-- Members: full CRUD on their own notes only.
create policy "notes_select_own" on public.notes
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notes_insert_own" on public.notes
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "notes_update_own" on public.notes
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notes_delete_own" on public.notes
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Admins: read every note (role-aware nav / oversight), but cannot write
-- someone else's note -- there is deliberately no admin update/delete/insert
-- policy on rows they don't own, so the negative RLS test has something to
-- prove.
create policy "notes_select_admin" on public.notes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

create policy "idempotency_keys_own" on public.idempotency_keys
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
