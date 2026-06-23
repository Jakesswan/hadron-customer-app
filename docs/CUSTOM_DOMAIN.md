# Go-live checklist — app.hadrongrp.com

The repo half is done: the `CNAME` file (repo root) contains `app.hadrongrp.com`,
so every GitHub Pages deploy will claim that domain. The app uses relative paths,
so no code changes are needed. Do the 3 steps below when ready.

## Step 1 — Cloudflare DNS (you've already got the zone here)
Cloudflare → `hadrongrp.com` → DNS → **Add record**:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `app` |
| Target | `jakesswan.github.io` |
| Proxy status | **DNS only (grey cloud)** ← important for GitHub Pages |

> Grey cloud lets GitHub serve its own HTTPS cert cleanly. (Orange/proxied also
> works but needs SSL/TLS = Full and is fiddlier — not worth it for a static app.)
> First check `app` isn't already used by the ERP.

## Step 2 — GitHub Pages
Repo → **Settings → Pages**:
1. Under **Custom domain**, enter `app.hadrongrp.com` → Save. (It should detect the
   `CNAME` file already in the repo.)
2. Wait for the green "DNS check successful" (minutes up to ~1 hour).
3. Tick **Enforce HTTPS** once it's available.

The old `jakesswan.github.io/hadron-customer-app` URL will auto-redirect to the
new domain.

## Step 3 — Supabase (don't skip — logins break without it)
Supabase dashboard (project `flttrqcstzprtxcdvexx`) → **Authentication → URL
Configuration**:
- **Site URL:** `https://app.hadrongrp.com`
- **Redirect URLs:** add `https://app.hadrongrp.com/**`

This keeps Google sign-in, password resets, and the SSO magic-links working on
the new domain (the app redirects to `location.origin`, which is now the new host).

## Step 4 — Verify
- Open `https://app.hadrongrp.com` → app loads over HTTPS (padlock).
- Sign in (Google + email) → lands back on the app, no redirect error.
- Install to home screen → opens at the new domain.

## Rollback
Remove the Custom domain in Settings → Pages (or delete the Cloudflare record).
The github.io URL keeps working throughout.
