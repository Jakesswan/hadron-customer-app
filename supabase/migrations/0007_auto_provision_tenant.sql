-- ============================================================
-- Migration 0007 — auto-provision a private tenant on signup
-- ============================================================
--   The old handle_new_user() created a profile with NO organisation_id, so every
--   public signup landed at organisation_id = NULL: they could see nothing and
--   could not create anything (all RLS is organisation_id = current_org()). That
--   made the app unusable for anyone who wasn't hand-added to an org, and left a
--   pile of NULL-org accounts in limbo.
--
--   For a public multi-tenant app, this makes signup self-serve: every new user
--   gets their OWN private organisation (type = 'customer', i.e. a Tenant) and is
--   made its customer_admin. They start empty and fully isolated — RLS already
--   guarantees they can only ever see current_org()'s rows, so no new tenant can
--   see Hadron's (or any other tenant's) data.
--
--   Safety: idempotent (won't double-provision or orphan an org if it fires
--   twice), and wrapped so a provisioning error can NEVER block a signup — on any
--   error it degrades to the old behaviour (a bare NULL-org profile).
--
--   Only affects FUTURE signups. Pre-existing NULL-org profiles are left as-is
--   (some may be staff who belong in an existing org) — sort those out per-account.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  new_org  uuid := gen_random_uuid();
  org_name text;
begin
  -- Idempotency: never double-provision (or orphan an org) if this fires twice.
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  org_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'company'),   ''),
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'My Organisation'
  );

  insert into public.organisations (id, name, slug, type)
  values (new_org, org_name, 'org-' || left(replace(new_org::text, '-', ''), 12), 'customer');

  insert into public.profiles (id, email, full_name, organisation_id, role)
  values (
    new.id, new.email,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), new.email),
    new_org, 'customer_admin'
  );

  return new;
exception when others then
  -- Never block a signup on a provisioning error: degrade to a bare profile.
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$function$;
