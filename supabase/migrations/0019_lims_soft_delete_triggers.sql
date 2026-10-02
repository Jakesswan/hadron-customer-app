-- 0019_lims_soft_delete_triggers.sql — deletion marks for the lab records, step 2 of 2 (after app v157 is live)
--
-- Problem: lims-sync's start-up push sends the local records the server doesn't have (before v154 it sent
-- every record). A record deleted on the server is simply absent, so a phone that missed the delete saw it
-- as "only on this phone" and inserted it again. Only the server can remember that an id was deleted.
--
-- Fix, like 0015 for sites / incidents (a mark, deleted_at, instead of the row disappearing):
--   * The server turns a DELETE into the mark itself (BEFORE DELETE trigger hg_soft_delete), so the delete
--     of every app version, and of the ERP feed, leaves a mark; clients keep sending plain DELETEs. A delete
--     the purge makes, or one made by another trigger (trigger depth above 1, e.g. a foreign-key cascade
--     when a whole organisation is removed), really deletes.
--   * A marked record comes back only when a write says so: from v157 the app sends deleted_at: null with
--     every lab write ("this record is live"), so a deliberate re-add under the same id works ("Load standard
--     tests", an edit made offline). An older app re-sending its
--     stale copy sends no deleted_at, so it leaves the mark alone (0018's column step, then app v157, then
--     this). The ERP feed (service role) is the master of its customers: any write of it brings one back
--     (BEFORE UPDATE trigger hg_revive_on_write). Every revive is written to the Postgres log.
--   * Marked rows stay SELECT-visible (RLS unchanged): every phone's pull sees the mark, drops its copy and
--     never sends it back. Marking is an UPDATE run as the caller, so RLS still decides who may delete.
--   * purge_deleted_records() (0016) really deletes marks older than 180 days here too. It sets hg.purging
--     first, which both triggers respect (and which keeps the foreign-key set-null updates it causes from
--     touching marks).
-- NOTE: a migration or SQL-editor update (role postgres) leaves marks alone, but a script using the
-- service key brings back every marked row it writes: filter deleted_at=is.null there. An undelete by hand
-- sets deleted_at = null explicitly.
-- The migration tests its triggers on temporary tables first and aborts, changing nothing, on any failure.

begin;
set local lock_timeout = '5s';

create or replace function public.hg_soft_delete() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The housekeeping purge really deletes; so does a foreign-key cascade (pg_trigger_depth() > 1): marking
  -- would leave the rows of a deleted organisation behind.
  if coalesce(current_setting('hg.purging', true), '') = 'on' or pg_trigger_depth() > 1 then
    return old;
  end if;
  execute format('update %I.%I set deleted_at = now() where id = $1 and deleted_at is null',
                 tg_table_schema, tg_table_name) using old.id;
  return null;                                     -- keep the row, marked: every phone learns of the delete
end
$$;

create or replace function public.hg_revive_on_write() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The ERP feed's write of a marked customer brings it back without saying so; an app's write must send
  -- deleted_at: null itself (v157+), so an older app's stale re-send can't undo a delete.
  if current_user = 'service_role'
     and coalesce(current_setting('hg.purging', true), '') <> 'on'
     and old.deleted_at is not null
     and new.deleted_at is not distinct from old.deleted_at then
    new.deleted_at := null;
  end if;
  if old.deleted_at is not null and new.deleted_at is null then
    raise log 'hg_revive %.% id=% role=% uid=%', tg_table_schema, tg_table_name, old.id, current_user, auth.uid();
  end if;
  return new;
end
$$;

-- Self-test on temporary tables (as the migration's role, not service_role): any wrong result raises, and the
-- whole migration rolls back.
do $$
declare d timestamptz; n integer; r text := current_user;
begin
  create temp table hg_0019_selftest (id text primary key, v integer, deleted_at timestamptz) on commit drop;
  create trigger t_del before delete on hg_0019_selftest for each row execute function public.hg_soft_delete();
  create trigger t_upd before update on hg_0019_selftest for each row execute function public.hg_revive_on_write();
  insert into hg_0019_selftest values ('a', 1, null), ('b', 1, null), ('c', 1, null);

  delete from hg_0019_selftest where id = 'a';
  select deleted_at into d from hg_0019_selftest where id = 'a';
  if not found or d is null then raise exception '0019 self-test: a delete did not leave a mark'; end if;

  update hg_0019_selftest set deleted_at = '2000-01-01 00:00:00+00' where id = 'a';
  delete from hg_0019_selftest where id = 'a';
  if (select deleted_at from hg_0019_selftest where id = 'a') is distinct from '2000-01-01 00:00:00+00'::timestamptz then
    raise exception '0019 self-test: a second delete moved the mark';
  end if;

  update hg_0019_selftest set v = 2 where id = 'a';
  if (select deleted_at from hg_0019_selftest where id = 'a') is null then
    raise exception '0019 self-test: a write without deleted_at (an older app''s re-send) brought the record back';
  end if;

  update hg_0019_selftest set v = 3, deleted_at = null where id = 'a';
  if (select deleted_at from hg_0019_selftest where id = 'a') is not null then
    raise exception '0019 self-test: a write saying deleted_at = null did not bring the record back';
  end if;

  -- The ERP feed's branch, on this project: a service_role write brings a mark back without saying so. If the
  -- migration's role can't become service_role, this check is skipped (its sub-block rolls back), not failed.
  begin
    grant select, update on hg_0019_selftest to service_role;
    update hg_0019_selftest set deleted_at = now() where id = 'a';
    perform set_config('role', 'service_role', true);
    update hg_0019_selftest set v = 5 where id = 'a';
    perform set_config('role', r, true);
    if (select deleted_at from hg_0019_selftest where id = 'a') is not null then
      raise exception '0019 self-test: a service_role write (the ERP feed) did not bring the record back';
    end if;
  exception when insufficient_privilege then
    null;
  end;

  update hg_0019_selftest set deleted_at = now() where id = 'b';
  if (select deleted_at from hg_0019_selftest where id = 'b') is null then
    raise exception '0019 self-test: an explicit mark was cleared';
  end if;

  delete from hg_0019_selftest where id = 'c';
  perform set_config('hg.purging', 'on', true);
  update hg_0019_selftest set v = 4 where id = 'c';
  if (select deleted_at from hg_0019_selftest where id = 'c') is null then
    raise exception '0019 self-test: an update during the purge cleared a mark';
  end if;
  delete from hg_0019_selftest where id in ('b', 'c');
  perform set_config('hg.purging', '', true);
  select count(*) into n from hg_0019_selftest;
  if n <> 1 then raise exception '0019 self-test: the purge did not really delete (% rows left)', n; end if;

  -- A foreign-key cascade (a parent deleted, e.g. an organisation) really deletes the child rows.
  create temp table hg_0019_parent (id text primary key) on commit drop;
  create temp table hg_0019_child (id text primary key, parent_id text references hg_0019_parent (id) on delete cascade,
                                   deleted_at timestamptz) on commit drop;
  create trigger t_cdel before delete on hg_0019_child for each row execute function public.hg_soft_delete();
  insert into hg_0019_parent values ('p');
  insert into hg_0019_child values ('k', 'p', null);
  delete from hg_0019_parent where id = 'p';
  if exists (select 1 from hg_0019_child) then
    raise exception '0019 self-test: a cascade from a deleted parent left a marked orphan';
  end if;

  drop table hg_0019_child;
  drop table hg_0019_parent;
  drop table hg_0019_selftest;
end
$$;

-- hg_soft_delete runs with search_path = '' and every trigger that fires under its UPDATE inherits it. Known:
-- trg_customers_touch / trg_samples_touch (touch_updated_at: only now()). Any other trigger whose function
-- doesn't pin search_path stops the migration so it can be reviewed first.
do $$
declare bad text;
begin
  select string_agg(format('%s.%s (%s)', t.tgrelid::regclass, t.tgname, t.tgfoid::regprocedure), '; ')
    into bad
  from pg_trigger t join pg_proc p on p.oid = t.tgfoid
  where not t.tgisinternal
    and t.tgrelid = any (array['public.customers','public.samples','public.sample_results','public.lims_tests',
          'public.lims_test_profiles','public.lims_worksheets','public.lims_instruments','public.lims_inventory',
          'public.lims_documents','public.lims_competencies','public.lims_personnel','public.lims_calibrations',
          'public.lims_ncs','public.lims_quotes']::regclass[])
    and t.tgname not in ('hg_soft_delete', 'hg_revive_on_write', 'trg_customers_touch', 'trg_samples_touch')
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%');
  if bad is not null then
    raise exception '0019: other triggers on the lab tables would run under an empty search_path; review first: %', bad;
  end if;
end
$$;

-- Both triggers on every LIMS table and customers (the column came in 0018).
do $$
declare t text;
begin
  foreach t in array array['customers', 'samples', 'sample_results', 'lims_tests', 'lims_test_profiles',
                           'lims_worksheets', 'lims_instruments', 'lims_inventory', 'lims_documents',
                           'lims_competencies', 'lims_personnel', 'lims_calibrations', 'lims_ncs', 'lims_quotes'] loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);   -- (in case 0018 was skipped)
    execute format('drop trigger if exists hg_soft_delete on public.%I', t);
    execute format('create trigger hg_soft_delete before delete on public.%I for each row execute function public.hg_soft_delete()', t);
    execute format('drop trigger if exists hg_revive_on_write on public.%I', t);
    execute format('create trigger hg_revive_on_write before update on public.%I for each row execute function public.hg_revive_on_write()', t);
  end loop;
end
$$;

-- Housekeeping (0016): marks older than the retention are really deleted, here too.
create or replace function public.purge_deleted_records(retention interval default '180 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare total integer := 0; n integer; t text;
begin
  -- First: the lab tables' triggers turn a DELETE into a mark unless the purge says so, and the sites purge
  -- below already sets samples.site_id to null on marked samples.
  perform set_config('hg.purging', 'on', true);
  delete from public.sites     where deleted_at is not null and deleted_at < now() - retention;
  get diagnostics n = row_count; total := total + n;
  delete from public.incidents where deleted_at is not null and deleted_at < now() - retention;
  get diagnostics n = row_count; total := total + n;
  foreach t in array array['sample_results', 'samples', 'lims_tests', 'lims_test_profiles', 'lims_worksheets',
                           'lims_instruments', 'lims_inventory', 'lims_documents', 'lims_competencies',
                           'lims_personnel', 'lims_calibrations', 'lims_ncs', 'lims_quotes', 'customers'] loop
    execute format('delete from public.%I where deleted_at is not null and deleted_at < now() - $1', t) using retention;
    get diagnostics n = row_count; total := total + n;
  end loop;
  perform set_config('hg.purging', '', true);
  return total;
end
$$;

-- Maintenance function only — never callable by app clients (as in 0016).
revoke all on function public.purge_deleted_records(interval) from public, anon, authenticated;

commit;
