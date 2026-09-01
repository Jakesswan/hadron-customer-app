-- 0015_soft_delete_tombstones.sql  (applied to prod flttrqcstzprtxcdvexx 2026-09-01)
-- Delete durability across owners/devices for the org-shared sites + incidents registers.
--
-- Problem (v116/v117): the pull was a union-merge that re-uploaded any local record absent from
-- the server ("migrate local-only up"). A client cannot tell "created locally, never uploaded"
-- from "uploaded, then deleted by another owner" — both are simply absent from the server — so
-- one owner's delete was resurrected org-wide by another owner's stale local cache. No client-only
-- scheme can fix this; the server must remember that an id was deleted.
--
-- Fix: SOFT delete. A delete sets deleted_at (a tombstone) instead of a hard DELETE. The row stays
-- SELECT-visible (RLS unchanged, org-scoped), so every device's pull sees the tombstone, drops the
-- record locally, and never re-pushes it. Live pushes (hgSiteToRow / hgIncidentToRow) never send
-- deleted_at, so an upsert of a tombstoned id (PostgREST ON CONFLICT DO UPDATE only touches the
-- columns sent) cannot clear the tombstone — a racing edit or a queued re-push can't resurrect it.
-- Soft-delete is an UPDATE, which RLS already restricts to owners (admin/customer_admin); no RLS
-- change is needed.
alter table public.sites     add column if not exists deleted_at timestamptz;
alter table public.incidents add column if not exists deleted_at timestamptz;
