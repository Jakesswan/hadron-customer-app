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
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

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

create or replace function public.is_hadron_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    join public.organisations o on o.id = p.organisation_id
    where p.id = auth.uid()
      and p.role = 'admin'
      and o.type = 'hadron'
  );
$$;

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
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists customers_org_idx on public.customers (organisation_id);

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

-- Helper macro: a "scoped" policy = visible to Hadron admins or to
-- members of the same organisation. We write it out explicitly below
-- because Postgres has no policy templates.

-- organisations: members of an org see their own org; Hadron admins see all
drop policy if exists "orgs_select" on public.organisations;
create policy "orgs_select" on public.organisations for select
  using (is_hadron_admin() or id = current_org());

drop policy if exists "orgs_admin_write" on public.organisations;
create policy "orgs_admin_write" on public.organisations for all
  using (is_hadron_admin())
  with check (is_hadron_admin());

-- profiles: see self + same org; admins see all
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (
    id = auth.uid()
    or is_hadron_admin()
    or organisation_id = current_org()
  );

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = current_app_role()); -- can't escalate own role

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  using (is_hadron_admin() or (current_app_role() = 'customer_admin' and organisation_id = current_org()))
  with check (is_hadron_admin() or (current_app_role() = 'customer_admin' and organisation_id = current_org()));

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles for insert
  with check (is_hadron_admin() or id = auth.uid());

-- generic "org-scoped" policies for the domain tables
do $$
declare t text;
begin
  for t in select unnest(array[
    'customers','sites','equipment','samples','sample_results','jobs','audit_log',
    'lims_tests','lims_test_profiles','lims_worksheets','lims_instruments','lims_inventory','lims_documents','lims_competencies'
  ]) loop
    execute format('drop policy if exists "%I_select" on public.%I', t||'_select', t);
    execute format($f$
      create policy "%I_select" on public.%I for select
        using (is_hadron_admin() or organisation_id = current_org())
    $f$, t||'_select', t);

    execute format('drop policy if exists "%I_write" on public.%I', t||'_write', t);
    execute format($f$
      create policy "%I_write" on public.%I for all
        using (
          is_hadron_admin()
          or (current_app_role() in ('customer_admin','operator') and organisation_id = current_org())
        )
        with check (
          is_hadron_admin()
          or (current_app_role() in ('customer_admin','operator') and organisation_id = current_org())
        )
    $f$, t||'_write', t);
  end loop;
end $$;

-- messages: special-cased because it uses recipient_org / recipient_user
-- instead of the generic organisation_id column.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select
  using (
    is_hadron_admin()
    or recipient_org = current_org()
    or recipient_user = auth.uid()
  );

drop policy if exists "messages_write" on public.messages;
create policy "messages_write" on public.messages for all
  using (
    is_hadron_admin()
    or (current_app_role() in ('customer_admin','operator') and recipient_org = current_org())
  )
  with check (
    is_hadron_admin()
    or (current_app_role() in ('customer_admin','operator') and recipient_org = current_org())
  );

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
  public.lims_competencies;

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
