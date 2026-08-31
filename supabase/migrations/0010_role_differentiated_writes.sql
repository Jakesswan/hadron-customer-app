-- 0010_role_differentiated_writes.sql  (applied to prod flttrqcstzprtxcdvexx 2026-08-31)
-- Replace the coarse `<t>_write FOR ALL` policies (which let operators UPDATE/DELETE) with
-- per-command policies:
--   INSERT        -> admin, customer_admin, operator   (techs create)
--   UPDATE/DELETE -> admin, customer_admin only         (only the master edits/deletes)
-- SELECT (`<t>_select`) policies are left untouched, so all roles keep org-scoped read.
-- Also re-adds the customers source<>'erp' guard (migration 0005 was never recorded on prod),
-- makes audit_log append-only, and closes the messages cross-tenant recipient_user gap.

-- ---- 17 standard organisation_id-scoped tables ----
do $$
declare
  t text;
  tbls text[] := array[
    'sites','equipment','samples','sample_results','jobs','service_reports',
    'lims_tests','lims_test_profiles','lims_worksheets','lims_instruments',
    'lims_inventory','lims_documents','lims_competencies','lims_personnel',
    'lims_calibrations','lims_ncs','lims_quotes'];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists %I on public.%I', t||'_write',  t);
    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format('drop policy if exists %I on public.%I', t||'_update', t);
    execute format('drop policy if exists %I on public.%I', t||'_delete', t);
    execute format($f$create policy %I on public.%I for insert
        with check (current_app_role() = any (array['admin','customer_admin','operator'])
                    and organisation_id = current_org())$f$, t||'_insert', t);
    execute format($f$create policy %I on public.%I for update
        using (current_app_role() = any (array['admin','customer_admin']) and organisation_id = current_org())
        with check (current_app_role() = any (array['admin','customer_admin']) and organisation_id = current_org())$f$,
        t||'_update', t);
    execute format($f$create policy %I on public.%I for delete
        using (current_app_role() = any (array['admin','customer_admin']) and organisation_id = current_org())$f$,
        t||'_delete', t);
  end loop;
end $$;

-- ---- customers: split + ERP-mastered rows read-only for everyone ----
drop policy if exists customers_write  on public.customers;
drop policy if exists customers_insert on public.customers;
drop policy if exists customers_update on public.customers;
drop policy if exists customers_delete on public.customers;
create policy customers_insert on public.customers for insert
  with check (current_app_role() = any (array['admin','customer_admin','operator'])
              and organisation_id = current_org() and source <> 'erp');
create policy customers_update on public.customers for update
  using  (current_app_role() = any (array['admin','customer_admin'])
          and organisation_id = current_org() and source <> 'erp')
  with check (current_app_role() = any (array['admin','customer_admin'])
              and organisation_id = current_org() and source <> 'erp');
create policy customers_delete on public.customers for delete
  using  (current_app_role() = any (array['admin','customer_admin'])
          and organisation_id = current_org() and source <> 'erp');

-- ---- messages: recipient_org-scoped + close cross-tenant recipient_user gap ----
drop policy if exists messages_write  on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
drop policy if exists messages_delete on public.messages;
create policy messages_insert on public.messages for insert
  with check (current_app_role() = any (array['admin','customer_admin','operator'])
              and recipient_org = current_org()
              and (recipient_user is null
                   or recipient_user in (select id from public.profiles where organisation_id = current_org())));
create policy messages_update on public.messages for update
  using  (current_app_role() = any (array['admin','customer_admin']) and recipient_org = current_org())
  with check (current_app_role() = any (array['admin','customer_admin']) and recipient_org = current_org());
create policy messages_delete on public.messages for delete
  using  (current_app_role() = any (array['admin','customer_admin']) and recipient_org = current_org());

-- ---- audit_log: append-only (insert only; no update/delete via the app) ----
drop policy if exists audit_log_write  on public.audit_log;
drop policy if exists audit_log_insert on public.audit_log;
drop policy if exists audit_log_update on public.audit_log;
drop policy if exists audit_log_delete on public.audit_log;
create policy audit_log_insert on public.audit_log for insert
  with check (current_app_role() = any (array['admin','customer_admin','operator'])
              and organisation_id = current_org());
