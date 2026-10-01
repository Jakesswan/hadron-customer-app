-- ============================================================
-- Migration 0017 — academy_progress: one record per learner per organisation
-- ============================================================
--   0004 keyed a learner's training record by their user id alone, and nothing tied the
--   record's id to the learner:
--     * a colleague in the same organisation could create a record under someone else's
--       id (their own user_id, the victim's id), so the victim's app merged forged modules
--       and scores and could never save their own progress again;
--     * a learner who moved organisation could never sync again (their id collided with
--       their old organisation's record, which the new organisation can't see or update).
--   From v147 the app keys each record "<user_id>:<organisation_id>". This check enforces
--   that shape; with the existing write policy (organisation_id = current_org() and
--   user_id = auth.uid()) a record can then only ever be the learner's OWN record in their
--   CURRENT organisation.
--
--   APPLIED to prod (Customer App project flttrqcstzprtxcdvexx) on 2026-10-01 via the
--   Supabase MCP (apply_migration "0017_academy_progress_per_org"), with Jaco's approval,
--   after v147 was live. The table held 0 rows. Verified: own "<user>:<org>" record
--   accepted; a user-id-only id and a record under a colleague's id are refused.
--   Idempotent (records written before v147 are re-keyed first).
-- ============================================================

begin;

-- Records written before v147 (id = user_id): re-key them as "<user_id>:<organisation_id>".
insert into public.academy_progress (id, organisation_id, user_id, payload, created_at, updated_at)
  select user_id::text || ':' || organisation_id::text, organisation_id, user_id, payload, created_at, updated_at
  from public.academy_progress
  where id = user_id::text
on conflict (id) do nothing;
delete from public.academy_progress where id = user_id::text;

alter table public.academy_progress drop constraint if exists academy_progress_id_is_user_org;
alter table public.academy_progress add constraint academy_progress_id_is_user_org
  check (id = user_id::text || ':' || organisation_id::text);

commit;
