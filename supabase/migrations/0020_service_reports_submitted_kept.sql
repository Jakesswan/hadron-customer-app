-- 0020_service_reports_submitted_kept.sql  (applied to prod flttrqcstzprtxcdvexx 2026-10-05)
-- A submitted service report can't be changed, by anyone (owner decision 2026-10-04): a correction is a new report, an
-- amendment of it (app v171: its number + A1, A2 …, with the reason why the date is the same and the readings differ).
-- An owner may still remove a submitted report from the app: it is kept on record (deleted_at set, the row stays as it
-- was), never deleted.
--
-- Before: owners (admin / customer_admin) could change or delete a submitted report (0010); operators couldn't change
-- it (0012 only lets them update their own drafts).
--
--  - deleted_at (new): set when an owner removes a submitted report. The app doesn't list such rows (v171).
--  - report_no, amends_id (new): the report's number and the report it amends (v171 amendments: SR-…-A1), set by the
--    server from the payload on every write (a trigger), so they always agree with it and the app needn't send them
--    (v171 works before this migration too). The app's report list reads them instead of unpacking every payload,
--    photos included. Empty for older reports until they are written again (they amend nothing).
--  - A trigger refuses, on a submitted row: any change except setting deleted_at (an owner) and the updated_at touch;
--    clearing deleted_at again; and DELETE. Removing an already removed report again keeps the first time (no error,
--    so two phones removing it both succeed). Error 42501, so the app's sync queue sets a refused write aside instead of
--    retrying it for ever, and tells the user (also on an app version older than v171).
--  - Rows that aren't submitted are as before. The service role (maintenance) isn't restricted.
--  - The foreign keys still work: deleting a user's account sets user_id to null on their reports (0006: on delete set
--    null), and deleting a whole organisation deletes its reports (on delete cascade). These run inside the referenced
--    table's trigger (depth > 1); only those two changes pass from there, nothing else.
--  - A no-op upsert of a submitted report (the same row sent again, e.g. a queue retry) still succeeds for an owner
--    (an operator's is refused by 0012's policy, as before).

begin;
set local lock_timeout = '5s';

alter table public.service_reports add column if not exists deleted_at timestamptz;
-- A report's number and the report it amends (v171 amendments: SR-…-A1), as columns the app's report list reads
-- without unpacking every payload (photos included). Set by the server (below); empty for older reports until they are
-- written again (they amend nothing, and their numbers stay in their payload).
alter table public.service_reports add column if not exists report_no text;
alter table public.service_reports add column if not exists amends_id text;

-- The app's role must read the three columns and set deleted_at (a column-level grant elsewhere would refuse them).
do $$
begin
  if not (has_column_privilege('authenticated', 'public.service_reports', 'report_no', 'SELECT')
      and has_column_privilege('authenticated', 'public.service_reports', 'amends_id', 'SELECT')
      and has_column_privilege('authenticated', 'public.service_reports', 'deleted_at', 'SELECT')
      and has_column_privilege('authenticated', 'public.service_reports', 'deleted_at', 'UPDATE')) then
    raise exception '0020: role authenticated cannot read the new service_reports columns or set deleted_at (column-level grants?)';
  end if;
end
$$;

-- Both are the payload's own (reportNo, amends.id), set by the server on every write: they always agree with the payload,
-- the app needn't send them, and an older app's writes fill them in too.
create or replace function public.service_reports_derive_cols()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.report_no := nullif(new.payload ->> 'reportNo', '');
  new.amends_id := nullif(new.payload -> 'amends' ->> 'id', '');
  return new;
end
$$;

drop trigger if exists trg_service_reports_derive_cols on public.service_reports;
create trigger trg_service_reports_derive_cols
  before insert or update on public.service_reports
  for each row execute function public.service_reports_derive_cols();

create or replace function public.service_reports_keep_submitted()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or old.status is distinct from 'submitted' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  -- A foreign key's own action (never a client's write): the author's account deleted (user_id set to null), or the
  -- whole organisation deleted (its reports go with it).
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' and not exists (select 1 from public.organisations o where o.id = old.organisation_id) then
      return old;
    end if;
    if tg_op = 'UPDATE' and new.user_id is null
       and (to_jsonb(new) - 'updated_at' - 'user_id' - 'report_no' - 'amends_id') = (to_jsonb(old) - 'updated_at' - 'user_id' - 'report_no' - 'amends_id') then
      return new;
    end if;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'A submitted service report is kept on record: it can be removed from the app, not deleted.'
      using errcode = '42501';
  end if;
  if (to_jsonb(new) - 'updated_at' - 'deleted_at' - 'report_no' - 'amends_id') is distinct from (to_jsonb(old) - 'updated_at' - 'deleted_at' - 'report_no' - 'amends_id') then   -- (those two follow the payload)
    raise exception 'A submitted service report can''t be changed: correct it with an amendment.'
      using errcode = '42501';
  end if;
  if old.deleted_at is not null then
    if new.deleted_at is null then
      raise exception 'A removed service report stays removed.' using errcode = '42501';
    end if;
    new.deleted_at := old.deleted_at;   -- removed again (another phone): the first removal stands
    return new;
  end if;
  if new.deleted_at is not null and coalesce(public.current_app_role(), '') not in ('admin', 'customer_admin') then
    raise exception 'Only the account owner can remove a submitted service report.' using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists trg_service_reports_keep_submitted on public.service_reports;
create trigger trg_service_reports_keep_submitted
  before update or delete on public.service_reports
  for each row execute function public.service_reports_keep_submitted();

-- PostgREST answers from a cached copy of the schema: reload it (delivered at commit), so the new columns can be read at
-- once (as 0018 did).
notify pgrst, 'reload schema';

commit;
