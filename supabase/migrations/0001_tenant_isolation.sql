-- ============================================================
-- Migration 0001 — Tenant isolation (Phase 1)
-- Remove Hadron staff "god-mode" from the App database.
-- ============================================================
--
-- CONTEXT
--   The original schema let any user whose role = 'admin' inside a
--   'hadron'-type organisation read and write EVERY organisation's data, via
--   the helper public.is_hadron_admin(). Under the locked architecture, every
--   organisation is a TENANT and must be a fully isolated island: a Tenant's
--   data is visible ONLY to members of that same Tenant. "Hadron Group" is
--   just another Tenant and receives no special cross-Tenant access.
--
-- WHAT THIS DOES
--   1. Neuters is_hadron_admin() so it always returns false (defence in depth:
--      anything still referencing it loses cross-Tenant access immediately).
--   2. Drops EVERY existing RLS policy on the sensitive tables (defensively,
--      by name from pg_policies — the original schema built some policy names
--      via a buggy format() call, so we don't trust the names) and recreates a
--      clean, purely organisation-scoped set. No cross-Tenant path remains.
--
-- OUT OF SCOPE (future work, intentionally not built here)
--   Cross-Tenant support work (Hadron helping a Tenant who asks for it) will be
--   a per-incident, time-bounded, audited "support session" grant — NOT a
--   permanent role. See Phase 3.
--
-- NOTES
--   * Assumes supabase-schema.sql has already been applied to this database.
--   * Idempotent: safe to run more than once.
--   * service_role bypasses RLS (used by signup tooling and the notify edge
--     function), so org creation / admin provisioning still work server-side.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Neuter the god-mode helper (kept as a no-op backstop).
-- ------------------------------------------------------------
create or replace function public.is_hadron_admin()
returns boolean
language sql immutable
as $$ select false $$;

comment on function public.is_hadron_admin() is
  'Retired in migration 0001. Always returns false. Cross-Tenant access is no '
  'longer granted by role; a future per-incident support-session grant will '
  'replace it. Do not reintroduce blanket staff access.';

-- ------------------------------------------------------------
-- 2. Wipe ALL existing policies on the sensitive tables so no
--    stale god-mode policy can survive, then recreate cleanly.
-- ------------------------------------------------------------
do $$
declare
  t   text;
  pol record;
  sensitive_tables text[] := array[
    'organisations','profiles','customers','sites','equipment','samples',
    'sample_results','jobs','audit_log','messages','push_subscriptions',
    'lims_tests','lims_test_profiles','lims_worksheets','lims_instruments',
    'lims_inventory','lims_documents','lims_competencies'
  ];
begin
  foreach t in array sensitive_tables loop
    -- Make sure RLS is on (no-op if already enabled).
    execute format('alter table public.%I enable row level security', t);
    -- Drop every policy currently on the table.
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3. Clean, organisation-scoped policies.
--    Every rule keys on current_org() = the caller's own organisation.
-- ------------------------------------------------------------

-- organisations: members see ONLY their own org; an org admin may update it.
-- Inserts/deletes are service_role-only (signup + admin tooling).
create policy "orgs_select" on public.organisations for select
  using (id = current_org());

create policy "orgs_update" on public.organisations for update
  using (id = current_org() and current_app_role() in ('admin','customer_admin'))
  with check (id = current_org() and current_app_role() in ('admin','customer_admin'));

-- profiles: see self or same-Tenant members; org admins manage their members.
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or organisation_id = current_org());

create policy "profiles_self_update" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = current_app_role());  -- cannot escalate own role

create policy "profiles_admin_update" on public.profiles for update
  using (current_app_role() in ('admin','customer_admin') and organisation_id = current_org())
  with check (current_app_role() in ('admin','customer_admin') and organisation_id = current_org());

create policy "profiles_insert" on public.profiles for insert
  with check (
    id = auth.uid()  -- self-provisioning (also handled by the signup trigger)
    or (current_app_role() in ('admin','customer_admin') and organisation_id = current_org())
  );

-- Generic domain tables: read within own org; write limited to
-- admin/customer_admin/operator within the SAME org (viewer is read-only).
do $$
declare t text;
begin
  for t in select unnest(array[
    'customers','sites','equipment','samples','sample_results','jobs','audit_log',
    'lims_tests','lims_test_profiles','lims_worksheets','lims_instruments',
    'lims_inventory','lims_documents','lims_competencies'
  ]) loop
    execute format(
      'create policy %I on public.%I for select using (organisation_id = current_org())',
      t || '_select', t);

    execute format(
      'create policy %I on public.%I for all '
      'using (current_app_role() in (''admin'',''customer_admin'',''operator'') '
      '       and organisation_id = current_org()) '
      'with check (current_app_role() in (''admin'',''customer_admin'',''operator'') '
      '       and organisation_id = current_org())',
      t || '_write', t);
  end loop;
end $$;

-- messages: special-cased — uses recipient_org / recipient_user.
create policy "messages_select" on public.messages for select
  using (recipient_org = current_org() or recipient_user = auth.uid());

create policy "messages_write" on public.messages for all
  using (current_app_role() in ('admin','customer_admin','operator') and recipient_org = current_org())
  with check (current_app_role() in ('admin','customer_admin','operator') and recipient_org = current_org());

-- push_subscriptions: a user manages only their own.
create policy "push_self" on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;
