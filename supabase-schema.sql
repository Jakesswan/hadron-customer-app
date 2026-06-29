-- ============================================================
-- Hadron Group — Supabase schema (v1)
--
-- Run this in your Supabase project's SQL editor once after
-- creating the project. Safe to re-run; uses CREATE ... IF NOT
-- EXISTS and CREATE OR REPLACE where possible.
--
-- After running:
--   1. Go to Authentication → Providers → enable Email + Google.
--   2. Authentication → URL Configuration → add your site URL
--      (e.g. https://jakesswan.github.io/hadron-customer-app and
--      https://hadrongrp.com) to Site URL and Redirect URLs.
--   3. Create one initial Hadron staff user via the Auth section,
--      then run the seed block at the bottom of this file.
-- ============================================================

-- ============================================================
-- 1. Reference / lookup tables
-- ============================================================

create table if not exists public.organisations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  type          text not null check (type in ('hadron','customer')),
  -- ERP bridge (migration 0002): null = standalone Tenant; set = mirrors this
  -- ERP tenant, Customers/Users arrive via the one-way ERP→App bridge.
  erp_tenant_id uuid,
  erp_linked_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
-- Keep the ERP-bridge columns present on databases created before migration 0002.
alter table public.organisations add column if not exists erp_tenant_id uuid;
alter table public.organisations add column if not exists erp_linked_at timestamptz;
create unique index if not exists organisations_erp_tenant_uidx
  on public.organisations (erp_tenant_id) where erp_tenant_id is not null;

-- Profiles map 1:1 to auth.users.
-- A user belongs to exactly one organisation and has one role.
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  full_name       text,
  phone           text,
  organisation_id uuid references public.organisations (id) on delete set null,
  role            text not null default 'operator'
                  check (role in ('admin','customer_admin','operator','viewer')),
  language        text default 'en',
  preferences     jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
-- Keep preferences column in sync for projects that ran the schema before this column was added.
alter table public.profiles add column if not exists preferences jsonb default '{}'::jsonb;

create index if not exists profiles_org_idx on public.profiles (organisation_id);

-- ============================================================
-- 2. Helper functions used by RLS policies
-- ============================================================

create or replace function public.current_org()
returns uuid
language sql stable security definer set search_path = public
as $$
  select organisation_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_app_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- RETIRED in migration 0001 (tenant isolation). Always returns false: every
-- organisation is an isolated Tenant and no role grants cross-Tenant access.
-- Kept as a no-op backstop so any historical reference also loses god-mode.
-- A future per-incident, time-bounded, audited "support session" grant will
-- replace it (Phase 3). Do NOT reintroduce blanket staff access here.
create or replace function public.is_hadron_admin()
returns boolean
language sql immutable
as $$ select false $$;

-- ============================================================
-- 3. Domain tables
-- ============================================================

-- NOTE on primary keys: org-scoped domain tables use TEXT primary keys so
-- they can carry the LIMS-generated string IDs (e.g. 'smp-LM7G3-abc1')
-- across devices without a UUID translation layer. profiles uses UUID
-- because it must match auth.users.id.

create table if not exists public.customers (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name            text not null,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  address         text,
  notes           text,
  payload         jsonb,        -- legacy fields that don't have a typed column yet
  -- ERP bridge (migration 0002): 'app' = created here (editable); 'erp' = bridged
  -- from the ERP (read-only). external_id = the ERP customer id / re-push key.
  source          text not null default 'app' check (source in ('app','erp')),
  external_id     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists customers_org_idx on public.customers (organisation_id);
-- Keep the ERP-bridge columns present on databases created before migration 0002.
alter table public.customers add column if not exists source text not null default 'app';
alter table public.customers add column if not exists external_id text;
create unique index if not exists customers_org_external_uidx
  on public.customers (organisation_id, external_id) where external_id is not null;

create table if not exists public.sites (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  customer_id     text references public.customers (id) on delete set null,
  name            text not null,
  address         text,
  latitude        numeric,
  longitude       numeric,
  system_type     text,    -- e.g. 'potable','sewage','effluent','cooling','boiler'
  source_type     text,    -- e.g. 'borehole','municipal','river','recycled'
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  status          text default 'active',
  payload         jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists sites_org_idx on public.sites (organisation_id);

create table if not exists public.equipment (
  id              text primary key,
  site_id         text not null references public.sites (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  label           text not null,
  equip_type      text,
  serial_no       text,
  install_date    date,
  last_service_at timestamptz,
  next_service_at timestamptz,
  payload         jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists equipment_org_idx on public.equipment (organisation_id);
create index if not exists equipment_site_idx on public.equipment (site_id);

create table if not exists public.samples (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  site_id         text references public.sites (id) on delete set null,
  customer_id     text references public.customers (id) on delete set null,
  sample_no       text,
  matrix          text,        -- 'potable','effluent','pool','cooling','process'
  sample_point    text,
  profile_code    text,        -- SANS 241 profile shorthand
  sampled_by      text,
  sampled_at      timestamptz,
  status          text default 'received',
  notes           text,
  payload         jsonb,        -- holds custody, genealogy, extras
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists samples_org_idx on public.samples (organisation_id);
create index if not exists samples_site_idx on public.samples (site_id);

create table if not exists public.sample_results (
  id              text primary key,
  sample_id       text not null references public.samples (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  test_code       text,
  test_name       text,
  value_text      text,
  value_num       numeric,
  units           text,
  method          text,
  sans241_class   text,        -- 'acute','chronic','aesthetic','operational' or null
  pass_fail       text,        -- 'pass','fail','warn','na'
  status          text,        -- LIMS lifecycle: pending, pending-review, authorised, rejected
  recorded_by     text,
  recorded_at     timestamptz default now(),
  payload         jsonb,
  created_at      timestamptz default now()
);
create index if not exists sr_sample_idx on public.sample_results (sample_id);
create index if not exists sr_org_idx on public.sample_results (organisation_id);

create table if not exists public.jobs (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  site_id         text references public.sites (id) on delete set null,
  customer_id     text references public.customers (id) on delete set null,
  title           text not null,
  description     text,
  scheduled_for   timestamptz,
  status          text default 'open',
  assigned_to     uuid references public.profiles (id) on delete set null,
  created_by      uuid references public.profiles (id) on delete set null,
  payload         jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists jobs_org_idx on public.jobs (organisation_id);
create index if not exists jobs_site_idx on public.jobs (site_id);

-- LIMS-internal tables (catalogue, worksheets, etc.) — also TEXT keys
-- so the IDs LIMS already generates carry through 1:1.

create table if not exists public.lims_tests (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists lims_tests_org_idx on public.lims_tests (organisation_id);

create table if not exists public.lims_test_profiles (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.lims_worksheets (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.lims_instruments (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.lims_inventory (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.lims_documents (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.lims_competencies (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists lims_comp_org_idx on public.lims_competencies (organisation_id);

-- LIMS stores synced from migration 0003 (lab staff, calibrations, NCs, quotes).
create table if not exists public.lims_personnel (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists lims_personnel_org_idx on public.lims_personnel (organisation_id);

create table if not exists public.lims_calibrations (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists lims_calibrations_org_idx on public.lims_calibrations (organisation_id);

create table if not exists public.lims_ncs (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists lims_ncs_org_idx on public.lims_ncs (organisation_id);

create table if not exists public.lims_quotes (
  id              text primary key,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists lims_quotes_org_idx on public.lims_quotes (organisation_id);

create table if not exists public.academy_progress (
  id              text primary key,                          -- = the learner's auth user id
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id         uuid not null references auth.users (id)   on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists academy_progress_org_idx  on public.academy_progress (organisation_id);
create index if not exists academy_progress_user_idx on public.academy_progress (user_id);

create table if not exists public.audit_log (
  id              bigserial primary key,
  organisation_id uuid references public.organisations (id) on delete cascade,
  user_id         uuid references public.profiles (id) on delete set null,
  entity_table    text not null,
  entity_id       uuid,
  action          text not null,
  payload         jsonb,
  created_at      timestamptz default now()
);
create index if not exists audit_org_idx on public.audit_log (organisation_id);
create index if not exists audit_entity_idx on public.audit_log (entity_table, entity_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  recipient_org   uuid references public.organisations (id) on delete cascade,
  recipient_user  uuid references public.profiles (id) on delete cascade,
  sender_user     uuid references public.profiles (id) on delete set null,
  subject         text not null,
  body            text,
  link            text,        -- deep-link e.g. '#lims/sample/<id>'
  read_at         timestamptz,
  created_at      timestamptz default now()
);
create index if not exists messages_org_idx on public.messages (recipient_org);
create index if not exists messages_user_idx on public.messages (recipient_user);

create table if not exists public.push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth_secret     text not null,
  user_agent      text,
  created_at      timestamptz default now(),
  unique (user_id, endpoint)
);

-- ============================================================
-- 4. Auto-create profile when a new auth user signs up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 5. updated_at maintenance
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'organisations','profiles','customers','sites','equipment',
    'samples','jobs'
  ]) loop
    execute format('drop trigger if exists trg_%I_touch on public.%I', t, t);
    execute format('create trigger trg_%I_touch before update on public.%I
                    for each row execute procedure public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ============================================================
-- 6. Row-Level Security
-- ============================================================

alter table public.organisations    enable row level security;
alter table public.profiles         enable row level security;
alter table public.customers        enable row level security;
alter table public.sites            enable row level security;
alter table public.equipment        enable row level security;
alter table public.samples          enable row level security;
alter table public.sample_results   enable row level security;
alter table public.jobs             enable row level security;
alter table public.audit_log        enable row level security;
alter table public.messages         enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.lims_tests          enable row level security;
alter table public.lims_test_profiles  enable row level security;
alter table public.lims_worksheets     enable row level security;
alter table public.lims_instruments    enable row level security;
alter table public.lims_inventory      enable row level security;
alter table public.lims_documents      enable row level security;
alter table public.lims_competencies   enable row level security;
alter table public.lims_personnel      enable row level security;
alter table public.lims_calibrations   enable row level security;
alter table public.lims_ncs            enable row level security;
alter table public.lims_quotes         enable row level security;
alter table public.academy_progress    enable row level security;

-- academy_progress (migration 0004): read = any signed-in org member (team training
-- dashboards); write = ONLY the learner's own record. Not in the generic loop below
-- because its write policy is per-user, not role-based.
drop policy if exists academy_progress_select on public.academy_progress;
create policy academy_progress_select on public.academy_progress
  for select using (organisation_id = current_org());
drop policy if exists academy_progress_write on public.academy_progress;
create policy academy_progress_write on public.academy_progress
  for all
  using      (organisation_id = current_org() and user_id = auth.uid())
  with check (organisation_id = current_org() and user_id = auth.uid());

-- TENANT ISOLATION (migration 0001): every policy is purely organisation-scoped.
-- A Tenant's data is visible ONLY to members of that same Tenant. There is no
-- cross-Tenant access path — "Hadron Group" is just another Tenant. Future
-- cross-Tenant support uses a per-incident, audited "support session" (Phase 3),
-- NOT a role. service_role bypasses RLS for signup/admin tooling.

-- organisations: members see ONLY their own org; an org admin may update it.
-- Inserts/deletes are service_role-only.
drop policy if exists "orgs_select" on public.organisations;
create policy "orgs_select" on public.organisations for select
  using (id = current_org());

drop policy if exists "orgs_admin_write" on public.organisations;
drop policy if exists "orgs_update" on public.organisations;
create policy "orgs_update" on public.organisations for update
  using (id = current_org() and current_app_role() in ('admin','customer_admin'))
  with check (id = current_org() and current_app_role() in ('admin','customer_admin'));

-- profiles: see self or same-Tenant members; org admins manage their members.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or organisation_id = current_org());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = current_app_role()); -- can't escalate own role

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  using (current_app_role() in ('admin','customer_admin') and organisation_id = current_org())
  with check (current_app_role() in ('admin','customer_admin') and organisation_id = current_org());

drop policy if exists "profiles_admin_insert" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (
    id = auth.uid()
    or (current_app_role() in ('admin','customer_admin') and organisation_id = current_org())
  );

-- generic "org-scoped" policies for the domain tables
do $$
declare t text;
begin
  for t in select unnest(array[
    'customers','sites','equipment','samples','sample_results','jobs','audit_log',
    'lims_tests','lims_test_profiles','lims_worksheets','lims_instruments','lims_inventory','lims_documents','lims_competencies',
    'lims_personnel','lims_calibrations','lims_ncs','lims_quotes'
  ]) loop
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format(
      'create policy %I on public.%I for select using (organisation_id = current_org())',
      t||'_select', t);

    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format(
      'create policy %I on public.%I for all '
      'using (current_app_role() in (''admin'',''customer_admin'',''operator'') '
      '       and organisation_id = current_org()) '
      'with check (current_app_role() in (''admin'',''customer_admin'',''operator'') '
      '       and organisation_id = current_org())',
      t||'_write', t);
  end loop;
end $$;

-- messages: special-cased because it uses recipient_org / recipient_user
-- instead of the generic organisation_id column.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select
  using (recipient_org = current_org() or recipient_user = auth.uid());

drop policy if exists "messages_write" on public.messages;
create policy "messages_write" on public.messages for all
  using (current_app_role() in ('admin','customer_admin','operator') and recipient_org = current_org())
  with check (current_app_role() in ('admin','customer_admin','operator') and recipient_org = current_org());

-- push subscriptions: user manages their own
drop policy if exists "push_self" on public.push_subscriptions;
create policy "push_self" on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 7. Realtime (so the app can subscribe to live changes)
-- ============================================================

alter publication supabase_realtime add table
  public.samples,
  public.sample_results,
  public.jobs,
  public.messages,
  public.sites,
  public.customers,
  public.equipment,
  public.lims_tests,
  public.lims_test_profiles,
  public.lims_worksheets,
  public.lims_instruments,
  public.lims_inventory,
  public.lims_documents,
  public.lims_competencies,
  public.lims_personnel,
  public.lims_calibrations,
  public.lims_ncs,
  public.lims_quotes,
  public.academy_progress;

-- ============================================================
-- 8. SEED — run AFTER your first user signs up via the app.
--    Replace YOUR_USER_EMAIL with the email you signed up with.
-- ============================================================
-- 1. Create the Hadron Group org row
-- 2. Promote your user to admin and link to that org
-- ============================================================
--
-- insert into public.organisations (name, slug, type)
--   values ('Hadron Group', 'hadron', 'hadron')
--   returning id;
--
-- update public.profiles
--   set role = 'admin',
--       organisation_id = (select id from public.organisations where slug = 'hadron')
--   where email = 'YOUR_USER_EMAIL';
