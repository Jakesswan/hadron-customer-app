-- ============================================================
-- VERIFY_ISOLATION.sql  —  run AFTER applying migration 0001
-- Paste into the Supabase SQL editor (runs as service_role).
-- Part A proves the god-mode is gone (runnable immediately, no setup).
-- Part B is the end-to-end cross-Tenant test (needs two real users).
-- ============================================================

-- ------------------------------------------------------------
-- PART A — STATIC AUDIT (no test data required)
-- ------------------------------------------------------------

-- A1. The god-mode helper must now return false.
select 'is_hadron_admin() =' as check, public.is_hadron_admin() as value;
-- EXPECT: false

-- A2. NO policy anywhere may still reference is_hadron_admin, or grant
--     blanket access via a literal `true`. This must return ZERO rows.
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (
        coalesce(qual, '')       ilike '%is_hadron_admin%'
     or coalesce(with_check, '') ilike '%is_hadron_admin%'
     or btrim(coalesce(qual, ''))       = 'true'
     or btrim(coalesce(with_check, '')) = 'true'
  );
-- EXPECT: 0 rows

-- A3. Every sensitive table must have RLS enabled AND at least one policy.
with sensitive(t) as (
  select unnest(array[
    'organisations','profiles','customers','sites','equipment','samples',
    'sample_results','jobs','audit_log','messages','push_subscriptions',
    'lims_tests','lims_test_profiles','lims_worksheets','lims_instruments',
    'lims_inventory','lims_documents','lims_competencies'])
)
select s.t as table_name,
       c.relrowsecurity as rls_enabled,
       count(p.policyname) as policy_count
from sensitive s
join pg_class c on c.relname = s.t and c.relnamespace = 'public'::regnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = s.t
group by s.t, c.relrowsecurity
order by s.t;
-- EXPECT: every row rls_enabled = true AND policy_count >= 1

-- A4. Eyeball the full clean policy set.
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT: every `qual` is org-scoped (current_org() / auth.uid()). No staff bypass.


-- ------------------------------------------------------------
-- PART B — END-TO-END CROSS-TENANT TEST (needs two real users)
-- ------------------------------------------------------------
-- Setup once:
--   1. Sign up two users in the app (or via Auth dashboard), e.g.
--        alice@test.example  -> will belong to Org A
--        bob@test.example    -> will belong to Org B
--   2. Create two orgs and link each user (service_role; RLS bypassed here):
--
--   insert into public.organisations (name, slug, type)
--     values ('Test Org A','test-org-a','customer'), ('Test Org B','test-org-b','customer');
--   update public.profiles set organisation_id =
--     (select id from public.organisations where slug='test-org-a'), role='customer_admin'
--     where email='alice@test.example';
--   update public.profiles set organisation_id =
--     (select id from public.organisations where slug='test-org-b'), role='customer_admin'
--     where email='bob@test.example';
--   3. Insert one customer into each org:
--   insert into public.customers (id, organisation_id, name) values
--     ('cust-A', (select id from public.organisations where slug='test-org-a'), 'A-only Customer'),
--     ('cust-B', (select id from public.organisations where slug='test-org-b'), 'B-only Customer');
--
-- Then impersonate each user and confirm they see ONLY their own org.
-- Replace <ALICE_UUID> with: select id from public.profiles where email='alice@test.example';

-- --- Impersonate Alice (Org A) ---
-- begin;
--   select set_config('role','authenticated', true);
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<ALICE_UUID>','role','authenticated')::text, true);
--   select current_org() as alice_org;            -- EXPECT: Org A's id
--   select id, name from public.customers;        -- EXPECT: only 'cust-A'
--   select count(*) as visible_orgs from public.organisations;  -- EXPECT: 1
-- rollback;

-- --- Impersonate Bob (Org B) ---
-- begin;
--   select set_config('role','authenticated', true);
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<BOB_UUID>','role','authenticated')::text, true);
--   select current_org() as bob_org;              -- EXPECT: Org B's id
--   select id, name from public.customers;        -- EXPECT: only 'cust-B'
--   select count(*) as visible_orgs from public.organisations;  -- EXPECT: 1
-- rollback;

-- PASS CRITERIA: Alice never sees cust-B (or Org B), Bob never sees cust-A
-- (or Org A), and neither sees more than their own single organisation.
