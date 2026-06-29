-- ============================================================
-- Migration 0003 — bring 4 previously local-only LIMS stores into the cloud
-- ============================================================
--   Personnel (lab staff), Calibrations, NCs/CAPAs, and Quotes were stored only
--   in each device's IndexedDB. They now sync per-tenant like the other LIMS
--   stores. Each gets a payload table mirroring the existing lims_* pattern,
--   org-scoped RLS (matching migration 0001), and realtime. Additive + idempotent.
--
--   Local store -> cloud table:  users->lims_personnel, calibrations->lims_calibrations,
--                                ncs->lims_ncs, quotes->lims_quotes
-- ============================================================

begin;

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

-- Org-scoped RLS (identical policy shape to migration 0001's domain tables).
do $$
declare t text;
begin
  for t in select unnest(array['lims_personnel','lims_calibrations','lims_ncs','lims_quotes']) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format('create policy %I on public.%I for select using (organisation_id = current_org())', t||'_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format(
      'create policy %I on public.%I for all '
      'using (current_app_role() in (''admin'',''customer_admin'',''operator'') and organisation_id = current_org()) '
      'with check (current_app_role() in (''admin'',''customer_admin'',''operator'') and organisation_id = current_org())',
      t||'_write', t);
  end loop;
end $$;

-- Realtime: add each table to the publication only if not already present.
do $$
declare t text;
begin
  for t in select unnest(array['lims_personnel','lims_calibrations','lims_ncs','lims_quotes']) loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

commit;
