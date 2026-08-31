-- 0009_profiles_policy_hardening.sql  (applied to prod flttrqcstzprtxcdvexx 2026-08-31)
-- Closes two live privilege-escalation holes in the profiles RLS. JWT/anon path only;
-- SECURITY DEFINER triggers (handle_new_user) + service_role bypass RLS and are unaffected.
--   H1: profiles_self_update pinned role but NOT organisation_id -> any user (all signups
--       are customer_admin of their own org) could self-set organisation_id to any known
--       org UUID = cross-tenant takeover. Fix: pin organisation_id = current_org().
--   H2: profiles_admin_update had no self-exclusion and no target-role cap -> a customer_admin
--       could self-promote to 'admin' or mint admins. Fix: id <> auth.uid() + role capped.

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid()
              and role = current_app_role()
              and organisation_id = current_org());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update
  using (current_app_role() = any (array['admin','customer_admin'])
         and organisation_id = current_org()
         and id <> auth.uid())
  with check (current_app_role() = any (array['admin','customer_admin'])
              and organisation_id = current_org()
              and id <> auth.uid()
              and role = any (array['operator','viewer']));
