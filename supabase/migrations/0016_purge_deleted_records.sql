-- 0016_purge_deleted_records.sql  (applied to prod flttrqcstzprtxcdvexx 2026-09-01)
-- Housekeeping for the soft-delete tombstones added in 0015. Tombstones (deleted_at set) must
-- live long enough that every device has pulled the deletion; a 180-day retention is far beyond
-- any real sync gap, so purging older ones cannot resurrect a record on a still-offline device.
-- Volume is trivial (dozens of records); this just keeps the tables tidy over years.
create extension if not exists pg_cron;

create or replace function public.purge_deleted_records(retention interval default '180 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer := 0; m integer := 0;
begin
  delete from public.sites     where deleted_at is not null and deleted_at < now() - retention;
  get diagnostics n = row_count;
  delete from public.incidents where deleted_at is not null and deleted_at < now() - retention;
  get diagnostics m = row_count;
  return n + m;
end
$$;

-- Maintenance function only — never callable by app clients.
revoke all on function public.purge_deleted_records(interval) from public, anon, authenticated;

-- Run daily at 03:15 UTC. Idempotent re-schedule: unschedule any prior job of this name first.
do $$
begin
  perform cron.unschedule('purge-deleted-records')
  where exists (select 1 from cron.job where jobname = 'purge-deleted-records');
end
$$;
select cron.schedule('purge-deleted-records', '15 3 * * *', $$select public.purge_deleted_records()$$);
