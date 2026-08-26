-- ============================================================
-- Migration 0006 — service_reports (digital service reports sync)
-- ============================================================
--   Field service reports were stored only in each device's localStorage
--   (hadron_sr), so a lost/replaced/wiped phone lost every report, signature
--   and photo, head office never got a central copy, and there was no backup.
--   This brings them into the cloud as a per-report record, organisation-scoped,
--   so reports survive the device and are visible to the whole org.
--
--   The whole report (incl. downscaled photos + signature as data URLs) is stored
--   as JSONB in `payload`; a few columns are duplicated out for cheap listing
--   without parsing the payload. organisation_id / user_id default from the
--   caller's session so the client only sends id + payload + a little metadata.
-- ============================================================

begin;

create table if not exists public.service_reports (
  id              text primary key,                                      -- the report's client uid
  organisation_id uuid not null default current_org()
                    references public.organisations (id) on delete cascade,
  user_id         uuid default auth.uid()
                    references auth.users (id) on delete set null,
  site            text,
  customer_name   text,
  technician      text,
  report_date     timestamptz,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists service_reports_org_idx  on public.service_reports (organisation_id);
create index if not exists service_reports_date_idx on public.service_reports (organisation_id, report_date desc);

alter table public.service_reports enable row level security;

-- Read: any signed-in member of the org (the field tech and head office).
drop policy if exists service_reports_select on public.service_reports;
create policy service_reports_select on public.service_reports
  for select using (organisation_id = current_org());

-- Write: operators / admins of the org may create, update and delete reports.
drop policy if exists service_reports_write on public.service_reports;
create policy service_reports_write on public.service_reports
  for all
  using      (current_app_role() in ('admin','customer_admin','operator') and organisation_id = current_org())
  with check (current_app_role() in ('admin','customer_admin','operator') and organisation_id = current_org());

-- Keep updated_at fresh, like the other domain tables.
drop trigger if exists trg_service_reports_touch on public.service_reports;
create trigger trg_service_reports_touch before update on public.service_reports
  for each row execute procedure public.touch_updated_at();

-- Realtime so a new report can surface on other devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_reports'
  ) then
    execute 'alter publication supabase_realtime add table public.service_reports';
  end if;
end $$;

commit;
