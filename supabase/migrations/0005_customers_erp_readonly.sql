-- ============================================================
-- Migration 0005 — customers: ERP-mastered rows are read-only in the App
-- ============================================================
--   The one-way ERP -> App bridge marks the customer records it owns with
--   source = 'erp' (the erp-ingest Edge Function, which writes via the
--   service_role key and therefore BYPASSES RLS). Until now the App's RLS write
--   policy on public.customers came from the generic org-scoped policy loop with
--   no source check (customers_write, "for all"), so any signed-in
--   operator / customer_admin / admin — or anyone holding the anon key with a
--   valid session — could UPDATE or DELETE an ERP-owned customer directly, or
--   INSERT a row masquerading as source = 'erp'. The "ERP is the source of truth,
--   the App is read-only for ERP records" contract was enforced only in client
--   JS (lims-sync mapOut / erp-ingest), i.e. not at all below the browser.
--
--   This closes the gap server-side, before the Phase-2 bridge goes live:
--     * READ  — unchanged: App users still SEE every customer in their org
--               (ERP + App). The select policy carries NO source check.
--     * WRITE — gated on source <> 'erp' in BOTH using (which existing rows an
--               App user may update/delete) and with check (which rows an
--               insert/update may PRODUCE — so an App user can't create a row as
--               source='erp' or flip an App row to 'erp').
--
--   The ERP bridge is unaffected: erp-ingest uses the service_role key, which
--   bypasses RLS, so it can still upsert/delete source='erp' rows. Mirrors how
--   academy_progress (migration 0004) is special-cased outside the generic loop.
--
--   Idempotent and reversible: re-running is safe; to revert, recreate
--   customers_write without the "and source <> 'erp'" clauses.
-- ============================================================

begin;

-- READ stays open — the App must still see ERP-owned customers (read-only), so
-- this is identical to the generic org-scoped select policy (no source check).
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers
  for select using (organisation_id = current_org());

-- WRITE is now gated on source <> 'erp'. Replaces the generic customers_write
-- created by the org-scoped policy loop.
drop policy if exists customers_write on public.customers;
create policy customers_write on public.customers
  for all
  using      (current_app_role() in ('admin','customer_admin','operator')
              and organisation_id = current_org()
              and source <> 'erp')
  with check (current_app_role() in ('admin','customer_admin','operator')
              and organisation_id = current_org()
              and source <> 'erp');

commit;
