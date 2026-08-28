# Turning on the live ERP → App bridge (customers + users)

This is the **ERP‑repo** side of connecting the ERP to the Hadron Customer App
through the `erp-ingest` API. The App side is done; this switches on the ERP's
existing push and adds the **users** payload. Hand this to a Claude session opened
in the ERP repo, or work through it yourself.

## What already exists
- **App receiver (`erp-ingest`)** — live, and now accepts a `users[]` payload as
  well as `customers[]` (deployed from the `hadron-customer-app` repo).
- **ERP push machinery** — `app_push_outbox` (write‑on‑change queue),
  `/api/cron/customer-app-push` (drains it, POSTs to the App), `app_push_log`
  (audit), and a *Settings → Integrations → Customer App* page. All built but
  **dormant** (0 rows, never configured/fired).
- **App consumers** — `erp_user_directory` + `handle_new_user()` already use the
  pushed users to link signups by email (App migrations 0007/0008).

## The API contract (App side — fixed)
```
POST https://flttrqcstzprtxcdvexx.supabase.co/functions/v1/erp-ingest
Authorization: Bearer sb_publishable_7_PDTLJxHx7tXxDbDeI6ow_DnEvoJGC   # App anon key (public)
X-Bridge-Secret: <BRIDGE_SHARED_SECRET>                                 # the real auth
Content-Type: application/json

{
  "erp_tenant_id": "ec437483-cb8d-4356-ba72-d689c1db12c7",   // Hadron tenant (the only App-linked one)
  "customers": [
    { "external_id": "<erp customers.id>", "name": "...", "contact_name": "...",
      "contact_email": "...", "contact_phone": "...", "address": "...", "deleted": false }
  ],
  "users": [
    { "email": "person@hadrongrp.com", "full_name": "...", "role": "customer_admin", "deleted": false }
  ]
}
```
- Send `customers[]`, `users[]`, or both. Response:
  `{ org_id, upserted, deleted, users_upserted, users_deleted, skipped, errors }`.
- The App resolves `erp_tenant_id` → its org itself. An unknown/unlinked tenant → 404.
- **Role mapping** (ERP role → App role for `users[].role`): `Administrator` →
  `customer_admin`; everything else → `operator`. (App roles allowed:
  `admin | customer_admin | operator | viewer`.)
- **Customer field mapping** (from ERP `customers`): `external_id`=id,
  `name`=coalesce(name, code), `contact_email`=email, `contact_phone`=coalesce(phone, mobile),
  `address`=concat_ws(', ', bill_street, bill_city, bill_region, bill_postal, bill_country),
  `deleted`=(deleted_at is not null).

## Steps

### 1. Deploy the updated `erp-ingest` (App side, one‑off)
From the `hadron-customer-app` repo: `supabase functions deploy erp-ingest`.
(It already contains the `users[]` support — just needs deploying.)

### 2. Set a fresh shared secret on BOTH sides
The App's current `BRIDGE_SHARED_SECRET` value isn't recoverable, so mint a new one
(`openssl rand -hex 32`) and set it identically in both places:
- **App:** `supabase secrets set BRIDGE_SHARED_SECRET=<value>` (or Supabase dashboard
  → Edge Functions → Secrets), on project `flttrqcstzprtxcdvexx`.
- **ERP:** the Customer‑App integration config (env var / the Settings page).

### 3. Configure the ERP's Customer‑App integration
Endpoint, App anon key, and `erp_tenant_id = ec437483-cb8d-4356-ba72-d689c1db12c7`
(as above). Store on the *Settings → Integrations → Customer App* config.

### 4. Enqueue on change → `app_push_outbox`
- **Customers** (probably already wired): on `customers` insert/update/soft‑delete
  for the tenant, enqueue `{ entity_type:'customer', entity_id, operation,
  payload_jsonb:<customer shape above> }`.
- **Users (NEW):** on `user_tenants` membership change for the tenant, or an
  `app_users` email/name change, enqueue `{ entity_type:'user', entity_id,
  operation, payload_jsonb:{ email, full_name, role, deleted } }`. Removing a user
  from the tenant → `deleted:true`.

### 5. Extend the drain worker (`/api/cron/customer-app-push`)
It drains the outbox and POSTs to `erp-ingest`. Extend it to build **both** arrays:
group pending rows by `tenant_id`, then
`body = { erp_tenant_id, customers: rows(entity_type='customer').map(payload),
users: rows(entity_type='user').map(payload) }`, POST with the headers above. On
200 mark rows done + log to `app_push_log`; on failure bump `attempts` /
`next_attempt_at` and log. (It likely already handles customers — add the users
branch.)

### 6. Schedule the cron
Ensure `/api/cron/customer-app-push` actually runs (vercel.json cron / your cron
provider) and is enabled.

### 7. One‑time backfill
Enqueue the current state once so the first run syncs everything:
- every non‑deleted `customers` row for tenant `ec437483…` → outbox (`customer`, upsert);
- every `app_users` in `user_tenants` for that tenant → outbox (`user`, upsert).
Then run the worker (or wait for the cron).

### 8. Verify
- `app_push_log` shows `http_status = 200`.
- On the App: `customers where source='erp'` and `erp_user_directory` reflect the ERP.
- End‑to‑end: a new ERP hire → after a sync their email is in `erp_user_directory`
  → they sign up on the App with that email → they land in the Hadron org.

## Notes
- This replaces the current **manual snapshots** (200 customers + 8 users I loaded
  by hand) with live sync. Same keys (`id = 'erp-'||external_id`, email lower‑cased),
  so it's seamless — no duplicates.
- Only the **Hadron** tenant is App‑linked today. To onboard another ERP tenant,
  create an App org with its `erp_tenant_id` set, then push that tenant too.
