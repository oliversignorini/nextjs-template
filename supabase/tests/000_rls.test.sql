begin;
select plan(9);

-- Every table in this profile must have RLS enabled (build contract gate 4,
-- item 5, "access control"). pgTAP has no built-in row_security_is_enabled;
-- pg_class.relrowsecurity is the source of truth `ALTER TABLE ... ENABLE
-- ROW LEVEL SECURITY` sets.
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.notes'::regclass),
  'notes has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.idempotency_keys'::regclass),
  'idempotency_keys has RLS enabled'
);

-- Three test users: one admin, two members. Bypasses GoTrue entirely --
-- this only needs auth.users to exist so the profiles trigger fires and
-- auth.uid() has something to resolve.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@pgtap.local', 'x', now(), '{}', '{"role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'member1@pgtap.local', 'x', now(), '{}', '{"role":"member"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'member2@pgtap.local', 'x', now(), '{}', '{"role":"member"}', now(), now());

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

select * from finish();
rollback;
