-- 0018_lims_deleted_at_columns.sql  (applied to prod flttrqcstzprtxcdvexx 2026-10-02)
-- Deletion marks for the lab records, step 1 of 2 (0019 adds the triggers).
--
-- Adds the deletion-mark column (deleted_at) to the LIMS tables and customers. On its own this changes
-- nothing for any app version: nothing reads or writes the column yet, and deletes stay real deletes.
-- It must be in place before app v157 goes live: from v157 every lab write sends deleted_at: null
-- ("this record is live"), which PostgREST rejects while the column doesn't exist.
-- 0019 then turns deletes into marks; see there for the why.

begin;
set local lock_timeout = '5s';

do $$
declare t text;
begin
  foreach t in array array['customers', 'samples', 'sample_results', 'lims_tests', 'lims_test_profiles',
                           'lims_worksheets', 'lims_instruments', 'lims_inventory', 'lims_documents',
                           'lims_competencies', 'lims_personnel', 'lims_calibrations', 'lims_ncs', 'lims_quotes'] loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
  end loop;
end
$$;

-- The app (role authenticated) must be able to read and write the new column on all 14 tables: Supabase's
-- table-level grants cover a new column, column-level ones would not (and every v157 lab write would fail).
do $$
declare t text;
begin
  foreach t in array array['customers', 'samples', 'sample_results', 'lims_tests', 'lims_test_profiles',
                           'lims_worksheets', 'lims_instruments', 'lims_inventory', 'lims_documents',
                           'lims_competencies', 'lims_personnel', 'lims_calibrations', 'lims_ncs', 'lims_quotes'] loop
    if not (has_column_privilege('authenticated', format('public.%I', t), 'deleted_at', 'SELECT')
        and has_column_privilege('authenticated', format('public.%I', t), 'deleted_at', 'INSERT')
        and has_column_privilege('authenticated', format('public.%I', t), 'deleted_at', 'UPDATE')) then
      raise exception '0018: role authenticated cannot read and write %.deleted_at (column-level grants?)', t;
    end if;
  end loop;
end
$$;

-- PostgREST answers from a cached copy of the schema: reload it (delivered at commit), so v157's writes with
-- deleted_at are accepted at once.
notify pgrst, 'reload schema';

commit;
