-- ============================================================
-- Migration 0004 — per-user Academy training records
-- ============================================================
--   Hadron Academy progress (completed modules + best quiz scores) was stored
--   only in each device's localStorage. This brings it into the cloud as a
--   PER-USER record, scoped to the organisation, so a learner's training history
--   follows them across devices and an org admin can see their team's progress.
--   Foundation for training records / certificates / the future paywall.
--
--   Payload shape: { courseId: { startedAt, completed:[moduleId], lastViewed, scores:{moduleId:pct} } }
-- ============================================================

begin;

create table if not exists public.academy_progress (
  id              text primary key,                          -- = the learner's auth user id
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id         uuid not null references auth.users (id)   on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists academy_progress_org_idx  on public.academy_progress (organisation_id);
create index if not exists academy_progress_user_idx on public.academy_progress (user_id);

alter table public.academy_progress enable row level security;

-- Read: any signed-in member of the org (enables team training dashboards).
drop policy if exists academy_progress_select on public.academy_progress;
create policy academy_progress_select on public.academy_progress
  for select using (organisation_id = current_org());

-- Write: a learner may only create / update / delete their OWN record, in their org.
drop policy if exists academy_progress_write on public.academy_progress;
create policy academy_progress_write on public.academy_progress
  for all
  using      (organisation_id = current_org() and user_id = auth.uid())
  with check (organisation_id = current_org() and user_id = auth.uid());

-- Realtime: add to the publication only if not already present.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'academy_progress'
  ) then
    execute 'alter publication supabase_realtime add table public.academy_progress';
  end if;
end $$;

commit;
