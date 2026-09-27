-- Demo resource: proves the full stack (RLS -> service -> API -> UI) end to end.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  created_at timestamptz not null default now()
);

-- (created_at, id) is the keyset pagination order: created_at alone ties on
-- same-transaction/batch inserts.
create index notes_user_id_created_at_id_idx on public.notes (user_id, created_at desc, id desc);

-- Idempotency keys for POST /api/v1/notes (agents/clients may retry safely).
-- Keyed per user (a global key let one user squat another's key and break
-- their retries under RLS) with a request hash (a reused key with a
-- different body is a caller bug, not a safe retry -- rejected with 409)
-- and a nullable response (null while the note-creation write is still in
-- flight, so a concurrent retry sees "in progress" instead of a half state).
-- claim_token identifies which in-flight attempt currently owns a pending
-- (response is null) row. Reclaiming a stale claim is a single atomic
-- `UPDATE ... WHERE response is null AND created_at < <threshold> RETURNING
-- claim_token` (lib/notes/service.ts): Postgres re-checks that WHERE clause
-- against the row's latest committed state when it takes the row lock, so
-- of two concurrent reclaim attempts exactly one gets a row back. Every
-- later write for that attempt (recording the response, or releasing the
-- claim on failure) is scoped by claim_token too, so a request that loses
-- the race can never clobber the winner's row.
create table public.idempotency_keys (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 255),
  request_hash text not null,
  response jsonb,
  claim_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  primary key (user_id, key)
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

-- N-5/m-11: the reclaim's staleness check and the reclaim's own write must
-- use the same clock. The *write* side is handled here: whenever a claim is
-- reassigned (claim_token changes -- an initial insert or a reclaim),
-- created_at is stamped with the DB's own now(), never a value the app
-- computed. lib/notes/service.ts's *read* side (the `created_at < threshold`
-- staleness check) gets the DB's now() via db_now() below instead of
-- process.env/Date.now(), so the two never drift against each other the way
-- an app-clock skew across instances could.
create function public.touch_idempotency_claim()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.claim_token is distinct from old.claim_token then
    new.created_at = now();
  end if;
  return new;
end;
$$;

create trigger idempotency_keys_touch_claim
  before update on public.idempotency_keys
  for each row execute function public.touch_idempotency_claim();

-- A clock getter, not business logic: lib/notes/service.ts calls this
-- instead of the app's Date.now() so every instance computes staleness
-- against the same clock the row's created_at was actually stamped with.
create function public.db_now()
returns timestamptz
language sql
stable
as $$
  select now()
$$;

revoke execute on function public.db_now() from public, anon;
grant execute on function public.db_now() to authenticated;
