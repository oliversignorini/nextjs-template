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
-- and to resolve "who owns this" in the UI). No update/insert/delete policy:
-- this skeleton has no user-editable profile field (email mirrors
-- auth.users and role is admin-only), so there is no legitimate self-service
-- write to allow. A future app that adds one (e.g. a display name) should
-- add a narrowly-scoped policy for that column, not reopen this one.
create policy "profiles_select_authenticated" on public.profiles
  for select
  to authenticated
  using (true);

-- Profile rows are created only by the trigger below (security definer,
-- bypasses RLS) and never updated or deleted directly.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- SECURITY: role must come from raw_app_meta_data, never
  -- raw_user_meta_data. user_metadata is set by the client at signup
  -- (supabase.auth.signUp({options:{data:{role:'admin'}}})) with only the
  -- anon key -- trusting it lets anyone self-register as admin.
  -- app_metadata can only be set by the service role (the Admin API), which
  -- is what scripts/supabase/seed.ts uses.
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'member')::public.app_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The Admin API's createUser/updateUserById do not set app_metadata in the
-- same statement as the INSERT: they insert the row first (app_metadata is
-- just {provider, providers}), then UPDATE it to merge in the caller's
-- app_metadata. An insert-only trigger reads the pre-update state and never
-- sees the role. This trigger keeps profiles.role in sync whenever
-- app_metadata changes -- at signup, when scripts/supabase/seed.ts creates
-- a demo user, and if an app later promotes/demotes a user with
-- admin.updateUserById({app_metadata:{role}}).
create function public.handle_user_role_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set role = coalesce(new.raw_app_meta_data ->> 'role', 'member')::public.app_role
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_app_metadata_updated
  after update of raw_app_meta_data on auth.users
  for each row execute function public.handle_user_role_sync();
