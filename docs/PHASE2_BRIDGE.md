# Phase 2 — ERP → App one-way bridge (design)

**Status:** foundation shipped (migration `0002`); transport + ingest not yet built.
**Goal:** for Tenants that use both products, the **ERP is the source of truth** for
**Customers** and **Users**, and pushes them **one way** into the App. Standalone
App Tenants are unaffected. Nothing flows App → ERP in this phase.

> Terminology: **Tenant** = a customer of Hadron (an `organisations` row).
> **Customer** = a customer of a Tenant (a `customers` row). See the schema.

---

## 1. Link model (App side — DONE in migration 0002)

- `organisations.erp_tenant_id` — the ERP `tenant_id` this org mirrors.
  `NULL` = standalone; set = **linked**.
- `organisations.erp_linked_at` — when the link was made.
- `customers.source` — `'app'` (created here, editable) or `'erp'` (bridged, read-only).
- `customers.external_id` — the ERP customer id; idempotency key for re-pushes
  (unique per org).

A Tenant is "linked" iff `erp_tenant_id is not null`. The App treats that as:
**disable "+ New Customer", render bridged Customers read-only.**

## 2. Identity mapping

| ERP | App |
|-----|-----|
| `tenants.id` (uuid) | `organisations.erp_tenant_id` |
| `customers.id` (uuid) | `customers.external_id` (org-scoped) |
| `users` / profiles (uuid) | `profiles.external_id` (Phase 2b) |

The App org must exist first and carry the right `erp_tenant_id` before any push
(the ingest rejects unknown tenants — never auto-creates orgs from a push).

## 3. Transport — **recommended: ERP pushes to an App ingest Edge Function**

ERP-side trigger / job → `POST https://flttrqcstzprtxcdvexx.functions.supabase.co/erp-ingest`
with a shared-secret header. The function runs with the **App** service-role key
and upserts into the App DB. RLS is bypassed (service role) but the function does
its own tenant check.

Why this shape: one-way, auditable, no DB-to-DB coupling, no ERP credentials in
the App and no App credentials in the browser. Alternatives considered — Postgres
FDW (couples two prod DBs) and App-pull (App would need ERP creds) — both rejected.

### App ingest contract (to build — Phase 2a)
```
POST /erp-ingest
Headers: X-Bridge-Secret: <shared secret stored as a Supabase function secret>
Body:
{
  "erp_tenant_id": "<uuid>",
  "customers": [
    { "external_id": "<erp uuid>", "name": "...", "contact_name": "...",
      "contact_email": "...", "contact_phone": "...", "address": "...",
      "deleted": false }
  ]
}
```
Behavior: resolve org by `erp_tenant_id` (404 if not linked); for each customer
`upsert` on `(organisation_id, external_id)` with `source='erp'`; `deleted:true`
→ soft handling; return `{ upserted, skipped, errors }`. Idempotent.

## 4. Users / auth — **DECISION NEEDED (Phase 2b)**

Bridging Users means a linked Tenant's people get an App login tied to their ERP
identity. Options:

- **(A) Pre-provision + invite (recommended).** Ingest creates an App auth user
  via the Admin API and sends a magic-link/invite; profile gets `source='erp'`,
  `external_id`. One identity per person, they set their own password.
- **(B) Contacts only.** Bridge users as non-login profile rows; they get a real
  login only when they self-sign-up with a matching email. Lower effort, weaker link.
- **(C) Shared SSO** between ERP and App. Cleanest long-term, biggest build.

Recommendation: ship **2a (Customers) first** with no auth changes, then do **2b
Users** with option (A).

## 5. App-side UI wiring (Phase 2a, after ingest works)

- When `org.erp_linked`, hide/disable "+ New Customer".
- Show a small "From ERP" badge on `source='erp'` customers; make their edit
  forms read-only.
- (Optional) "Last synced" indicator from `erp_linked_at` / a sync log.

## 6. Work split

| App side (this repo/session) | ERP side (`Hadron-ERP` repo/session) |
|---|---|
| migration 0002 (done) | add a "push to App" job/trigger on customer + user changes |
| `erp-ingest` edge function | store the shared secret; call ingest with the App's tenant mapping |
| UI: disable create + read-only badges | let an admin set which ERP tenant ↔ which App org |
| 2b: auth provisioning on ingest | 2b: include users in the push payload |

## 7. Open decisions for Jaco
1. **Transport** — confirm "ERP pushes to App ingest function" (vs. another shape).
2. **Users/auth** — pick (A) pre-provision+invite, (B) contacts-only, or (C) SSO.
3. **Linking UX** — who sets `erp_tenant_id` on an App org, and where (ERP admin
   screen vs. a one-time Hadron-run step)?
