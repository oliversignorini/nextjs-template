-- Profiles: one row per auth.users row, carries the app role used for RBAC.
-- RLS is defence in depth here; the service layer (lib/profiles/service.ts)
-- is the only code path the app or the API ever calls.

create type public.app_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Every authenticated user can read every profile (needed for role-aware nav
-- and to resolve "who owns this" in the UI); only the owner can update their
-- own non-role fields, and only via the service layer (role changes are a
-- separate admin-only capability, not implemented in this skeleton).
create policy "profiles_select_authenticated" on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own" on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select role from public.profiles where id = (select auth.uid())));

-- No insert/delete policy: profile rows are created only by the trigger
-- below (security definer, bypasses RLS) and never deleted directly.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'member')::public.app_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
