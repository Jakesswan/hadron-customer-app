-- 0013_incidents.sql  (applied to prod flttrqcstzprtxcdvexx 2026-08-31)
-- Incident reports, shared across the org (was local-only in localStorage 'hadron_incident').
-- Minimal shape: the full incident object lives in payload; org/user default server-side.
-- Role model matches service_reports: operators + owners CREATE + everyone in the org VIEWS;
-- only owners (admin/customer_admin) may UPDATE/DELETE.
create table if not exists public.incidents (
  id text primary key,
  organisation_id uuid not null default current_org() references public.organisations(id) on delete cascade,
  user_id uuid default auth.uid(),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incidents enable row level security;

drop policy if exists incidents_select on public.incidents;
create policy incidents_select on public.incidents for select
  using (organisation_id = current_org());

drop policy if exists incidents_insert on public.incidents;
create policy incidents_insert on public.incidents for insert
  with check (current_app_role() = any (array['admin','customer_admin','operator'])
              and organisation_id = current_org());

drop policy if exists incidents_update on public.incidents;
create policy incidents_update on public.incidents for update
  using  (current_app_role() = any (array['admin','customer_admin']) and organisation_id = current_org())
  with check (current_app_role() = any (array['admin','customer_admin']) and organisation_id = current_org());

drop policy if exists incidents_delete on public.incidents;
create policy incidents_delete on public.incidents for delete
  using (current_app_role() = any (array['admin','customer_admin']) and organisation_id = current_org());
