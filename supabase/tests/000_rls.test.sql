begin;
select plan(18);

-- Generic, table-agnostic: a new table that ships without RLS enabled or
-- without a policy fails this immediately, instead of silently passing a
-- hardcoded list of the tables that existed when this file was written.
select is_empty(
  $$
    select tablename from pg_tables t
    where schemaname = 'public'
      and not exists (
        select 1 from pg_class c
        where c.relname = t.tablename
          and c.relnamespace = 'public'::regnamespace
          and c.relrowsecurity
      )
  $$,
  'every public table has RLS enabled'
);

select is_empty(
  $$
    select tablename from pg_tables t
    where schemaname = 'public'
      and not exists (
        select 1 from pg_policies p
        where p.schemaname = 'public' and p.tablename = t.tablename
      )
  $$,
  'every public table has at least one policy'
);

-- Four test users: one admin (role set via app_metadata -- the only place
-- the trigger trusts), two ordinary members, and one "escalator" who sets
-- user_metadata.role=admin the way a client-controlled signUp() would
-- (options.data lands in raw_user_meta_data, never raw_app_meta_data).
-- Bypasses GoTrue entirely -- this only needs auth.users to exist so the
-- profiles trigger fires and auth.uid() has something to resolve.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@pgtap.local', 'x', now(), '{"role":"admin"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'member1@pgtap.local', 'x', now(), '{"role":"member"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'member2@pgtap.local', 'x', now(), '{"role":"member"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'escalator@pgtap.local', 'x', now(), '{}', '{"role":"admin"}', now(), now());

-- Regression: the Admin API's createUser/updateUserById insert the row
-- first (app_metadata is just {provider,providers}) and only merge in the
-- caller's app_metadata via a separate UPDATE -- this is exactly how
-- scripts/supabase/seed.ts creates admin@demo.test. An insert-only trigger
-- reads the pre-update state and never sees the role.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'two-step-admin@pgtap.local', 'x', now(), '{}', '{}', now(), now());
update auth.users set raw_app_meta_data = '{"role":"admin"}' where id = '66666666-6666-6666-6666-666666666666';
select is(
  (select role::text from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'admin',
  'app_metadata set via a later UPDATE (as the Admin API does) still lands in profiles.role'
);

-- B-1 regression: a client can only ever set user_metadata (the anon key,
-- signUp's options.data). If the trigger ever reads raw_user_meta_data
-- again, this is the test that catches it.
select is(
  (select role::text from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  'member',
  'user_metadata.role=admin at signup does not grant admin (role only comes from app_metadata)'
);

-- member1 creates their own note.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
insert into public.notes (user_id, title) values ('22222222-2222-2222-2222-222222222222', 'member1 note');
reset role;

-- member1 cannot insert a note owned by someone else.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
select throws_ok(
  $$insert into public.notes (user_id, title) values ('33333333-3333-3333-3333-333333333333', 'forged')$$,
  '42501',
  null,
  'member cannot insert a note for another user (with check fails)'
);
reset role;

-- member1 can see their own note.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
select isnt_empty($$select id from public.notes where title = 'member1 note'$$, 'owner can see their own note');
reset role;

-- member2 (a different user, same role) cannot see member1's note.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333"}';
select is_empty($$select id from public.notes where title = 'member1 note'$$, 'a different member cannot see it');
reset role;

-- admin (a different role) can see it, but cannot modify or delete it.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
select isnt_empty($$select id from public.notes where title = 'member1 note'$$, 'admin can see every note');
delete from public.notes where title = 'member1 note';
select is(
  (select count(*)::int from public.notes where title = 'member1 note'),
  1,
  'admin delete has no effect: no delete policy grants it on rows it does not own'
);
update public.notes set title = 'hijacked' where title = 'member1 note';
select is(
  (select count(*)::int from public.notes where title = 'member1 note'),
  1,
  'admin update has no effect either'
);
reset role;

-- profiles: no update/insert/delete policy exists for anyone (m-8: email
-- mirrors auth.users, role is admin-only -- there is no legitimate
-- self-service write). A member trying to self-promote gets a no-op
-- update, and insert/delete are denied outright.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
update public.profiles set role = 'admin' where id = '22222222-2222-2222-2222-222222222222';
select is(
  (select role::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'member',
  'a member cannot self-promote to admin (no update policy grants it)'
);
select throws_ok(
  $$insert into public.profiles (id, email, role) values ('55555555-5555-5555-5555-555555555555', 'x@x.local', 'admin')$$,
  '42501',
  null,
  'no one can insert a profile row directly (only the trigger, security definer)'
);
-- (DELETE/UPDATE with no matching policy is a silent no-op under RLS, not
-- an error -- only INSERT's WITH CHECK failure raises 42501.)
delete from public.profiles where id = '22222222-2222-2222-2222-222222222222';
select isnt_empty(
  $$select id from public.profiles where id = '22222222-2222-2222-2222-222222222222'$$,
  'no one can delete a profile row directly (no delete policy grants it)'
);
reset role;

-- idempotency_keys: cross-user isolation, and a member cannot claim a key
-- under someone else's user_id.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
insert into public.idempotency_keys (user_id, key, request_hash, response)
values ('22222222-2222-2222-2222-222222222222', 'k1', 'h1', '{"ok":true}');
select throws_ok(
  $$insert into public.idempotency_keys (user_id, key, request_hash, response) values ('33333333-3333-3333-3333-333333333333', 'k2', 'h2', '{}')$$,
  '42501',
  null,
  'a member cannot claim an idempotency key under a different user_id'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333"}';
select is_empty(
  $$select key from public.idempotency_keys where key = 'k1'$$,
  'a different member cannot see another user''s idempotency key'
);
reset role;

-- anon: no policy on any table is scoped `to anon`, so an unauthenticated
-- caller sees nothing anywhere.
set local role anon;
select is_empty($$select id from public.profiles$$, 'anon cannot read profiles');
select is_empty($$select id from public.notes$$, 'anon cannot read notes');
select is_empty($$select key from public.idempotency_keys$$, 'anon cannot read idempotency_keys');
reset role;

select * from finish();
rollback;
