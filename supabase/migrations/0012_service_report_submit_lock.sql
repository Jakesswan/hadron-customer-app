-- 0012_service_report_submit_lock.sql  (applied to prod flttrqcstzprtxcdvexx 2026-08-31)
-- Submit-then-lock for service reports (owner decision: techs can fix a report until they
-- Submit it, then it locks). An operator may UPDATE only their OWN report while it is a
-- draft; flipping status to 'submitted' locks it out of this policy. The admin/customer_admin
-- full-update policy from 0010 still lets the master edit anything.
-- (DB is ready; the Submit button + read-only-open UI is a follow-on to the team-roles v1.)

alter table public.service_reports
  add column if not exists status text not null default 'draft'
  check (status in ('draft','submitted'));

drop policy if exists service_reports_operator_draft_update on public.service_reports;
create policy service_reports_operator_draft_update on public.service_reports for update
  using  (current_app_role() = 'operator' and organisation_id = current_org()
          and user_id = auth.uid() and status = 'draft')
  with check (current_app_role() = 'operator' and organisation_id = current_org()
              and user_id = auth.uid() and status = any (array['draft','submitted']));
