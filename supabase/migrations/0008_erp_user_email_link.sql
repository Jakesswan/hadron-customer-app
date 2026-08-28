-- ============================================================
-- Migration 0008 — link App signups to an ERP tenant by email
-- ============================================================
--   Desired behaviour: a person registered in the ERP who creates an App account
--   with the SAME email should land in their ERP tenant's App organisation (and
--   see that tenant's ERP-synced data), instead of getting a brand-new blank
--   tenant. Anyone whose email is NOT an ERP user still gets their own private
--   tenant (migration 0007).
--
--   Constraint: the App and ERP are separate Supabase projects, so the App's
--   signup trigger can't query the ERP live. Instead the App keeps a local
--   directory of "ERP email -> App org + role", seeded from the ERP and kept
--   fresh by the ERP->App bridge (the same push that syncs customers should also
--   upsert users into this table). handle_new_user() matches the signup email
--   against it.
--
--   Role mapping applied when seeding: ERP 'Administrator' -> customer_admin,
--   all other ERP roles -> operator.
--
--   NOTE: the directory is only as current as the last ERP push. Until the bridge
--   pushes users automatically, new ERP hires must be added here (or they'll get
--   their own tenant on signup). Seed rows are tenant-specific data, applied
--   separately (not in this migration).
-- ============================================================

create table if not exists public.erp_user_directory (
  email           text primary key,                       -- lower-cased ERP email
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  role            text not null default 'operator' check (role in ('admin','customer_admin','operator','viewer')),
  erp_tenant_id   uuid,
  updated_at      timestamptz default now()
);
-- RLS on, no policies: only the SECURITY DEFINER trigger / service role read it
-- (it holds staff emails). Add policies later if a management UI is built.
alter table public.erp_user_directory enable row level security;

-- Signup: link by ERP email first, else auto-provision a private tenant (0007).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  new_org uuid;
  org_name text;
  linked_org uuid;
  linked_role text;
begin
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  -- 1) Known ERP user? Join their ERP tenant's App org (with the mapped role).
  select organisation_id, role into linked_org, linked_role
  from public.erp_user_directory
  where email = lower(btrim(new.email));

  if linked_org is not null then
    insert into public.profiles (id, email, full_name, organisation_id, role)
    values (new.id, new.email,
            coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), new.email),
            linked_org, coalesce(linked_role, 'operator'));
    return new;
  end if;

  -- 2) Otherwise auto-provision a private tenant, signer = customer_admin.
  new_org := gen_random_uuid();
  org_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'company'),   ''),
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'My Organisation');
  insert into public.organisations (id, name, slug, type)
  values (new_org, org_name, 'org-' || left(replace(new_org::text, '-', ''), 12), 'customer');
  insert into public.profiles (id, email, full_name, organisation_id, role)
  values (new.id, new.email,
          coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), new.email),
          new_org, 'customer_admin');
  return new;
exception when others then
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$function$;
