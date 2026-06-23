-- ============================================================
-- Migration 0002 — ERP→App bridge foundation (Phase 2a)
-- Additive schema only. Safe to apply any time; changes no existing data
-- and does not alter RLS (everything stays organisation-scoped).
-- ============================================================
--
-- CONTEXT
--   Some Tenants use both the ERP and the App. For those, the ERP is the
--   source of truth for Customer + User master data and pushes it ONE WAY into
--   the App. This migration adds the columns the App needs to:
--     * mark an organisation as ERP-linked (and to which ERP tenant), and
--     * tag individual records as ERP-owned vs App-owned, so the UI can make
--       bridged records read-only and disable "+ New Customer" when linked.
--
--   It does NOT build the transport or the ingest function yet — see
--   docs/PHASE2_BRIDGE.md. Standalone Tenants are unaffected (all columns
--   default to the standalone/app values).
-- ============================================================

begin;

-- organisations: which ERP tenant (if any) this org mirrors.
-- erp_tenant_id IS NULL  => standalone App Tenant (creates its own Customers).
-- erp_tenant_id NOT NULL => linked; Customers/Users come from the ERP bridge.
alter table public.organisations
  add column if not exists erp_tenant_id  uuid,
  add column if not exists erp_linked_at  timestamptz;

-- One ERP tenant maps to at most one App organisation.
create unique index if not exists organisations_erp_tenant_uidx
  on public.organisations (erp_tenant_id)
  where erp_tenant_id is not null;

-- customers: provenance of each row.
-- source = 'app' => created in the App (standalone). Editable in the App.
-- source = 'erp' => bridged from the ERP. Read-only in the App; external_id is
--   the ERP customer id and is the idempotency key for re-pushes.
alter table public.customers
  add column if not exists source       text not null default 'app',
  add column if not exists external_id  text;

-- Guard the allowed values without failing if the constraint already exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_source_chk'
  ) then
    alter table public.customers
      add constraint customers_source_chk check (source in ('app','erp'));
  end if;
end $$;

-- Re-pushing the same ERP customer upserts instead of duplicating.
-- (NULL external_id for app-origin rows never collides.)
create unique index if not exists customers_org_external_uidx
  on public.customers (organisation_id, external_id)
  where external_id is not null;

commit;
