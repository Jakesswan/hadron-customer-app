-- 0011_org_invites.sql  (applied to prod flttrqcstzprtxcdvexx 2026-08-31)
-- Team invites: a customer_admin invites teammates into their org by email.
-- Consent-based (no silent trigger placement -> closes H5): the invitee sees a prompt
-- after login and explicitly accepts via redeem_org_invite().

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  role text not null default 'operator' check (role in ('operator','viewer')),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (email, organisation_id)
);
create index if not exists org_invites_pending_email_idx
  on public.org_invites (email) where status = 'pending';

alter table public.org_invites enable row level security;

-- Only an org's own admins can see/write that org's invites; role capped to operator/viewer.
drop policy if exists org_invites_admin_all on public.org_invites;
create policy org_invites_admin_all on public.org_invites for all
  using  (organisation_id = current_org()
          and current_app_role() = any (array['admin','customer_admin']))
  with check (organisation_id = current_org()
              and current_app_role() = any (array['admin','customer_admin'])
              and role = any (array['operator','viewer']));

-- Does the caller have a pending invite? (SECURITY DEFINER bypasses the admin-only RLS
-- above so the invitee can see the offer). Returns null if none.
create or replace function public.my_pending_invite()
returns jsonb language plpgsql security definer set search_path to 'public' stable
as $fn$
declare inv record; org_nm text;
begin
  if auth.uid() is null then return null; end if;
  select * into inv from public.org_invites
    where email = lower(btrim(auth.email())) and status = 'pending'
    order by created_at desc limit 1;
  if not found then return null; end if;
  select name into org_nm from public.organisations where id = inv.organisation_id;
  return jsonb_build_object('organisation_id', inv.organisation_id, 'organisation', org_nm, 'role', inv.role);
end;
$fn$;

-- Accept the caller's pending invite: move them into the inviting org at the invited role.
-- SECURITY DEFINER so it can move a profile the RLS wall otherwise pins. Role is clamped.
create or replace function public.redeem_org_invite()
returns jsonb language plpgsql security definer set search_path to 'public'
as $fn$
declare inv record;
begin
  if auth.uid() is null then return jsonb_build_object('joined', false); end if;
  select * into inv from public.org_invites
    where email = lower(btrim(auth.email())) and status = 'pending'
    order by created_at desc limit 1;
  if not found then return jsonb_build_object('joined', false); end if;
  if inv.role not in ('operator','viewer') then return jsonb_build_object('joined', false); end if;
  update public.profiles set organisation_id = inv.organisation_id, role = inv.role
   where id = auth.uid();
  update public.org_invites set status = 'accepted', accepted_at = now() where id = inv.id;
  -- The caller's old auto-provisioned org (if any) is left as a harmless empty orphan;
  -- a later scheduled sweep can remove memberless, data-free customer orgs (avoids H8 cascade).
  return jsonb_build_object('joined', true, 'role', inv.role);
end;
$fn$;

revoke all on function public.my_pending_invite() from public, anon;
revoke all on function public.redeem_org_invite() from public, anon;
grant execute on function public.my_pending_invite() to authenticated;
grant execute on function public.redeem_org_invite() to authenticated;
