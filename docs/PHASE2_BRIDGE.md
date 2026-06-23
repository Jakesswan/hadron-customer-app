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

## 4. Users / auth — **DECISION: Shared SSO** (Jaco, 2026-06-23)

One identity logs into both the ERP and the App. Because the two run on
**separate Supabase projects**, "shared SSO" means a single OIDC identity
authority that both projects trust — Supabase cannot natively accept another
Supabase project's JWTs.

**Recommended mechanism — ERP is the identity authority:**
- Put an OIDC issuer in front of identity. Realistic options: the ERP's own
  Supabase as issuer exposed via an OIDC-compatible provider, or a dedicated IdP
  (Microsoft Entra ID / Google Workspace if Hadron staff already use one;
  otherwise Auth0 / WorkOS / Keycloak).
- Configure the **App** Supabase project's *Third-Party Auth* to trust that
  issuer. Linked-Tenant users authenticate once; the App accepts the token and
  maps `sub` → `profiles.external_id`.
- **Standalone App-only Tenants keep the App's own Supabase auth** (email /
  Google). SSO applies only to linked Tenants.

**Implications (why this is its own phase):**
- Touches BOTH Supabase projects' dashboards + an IdP — most of it is config and
  ERP-side work, done in the `Hadron-ERP` session, not buildable from the App
  repo alone.
- Needs one more decision: **which IdP / issuer** (driven by what Hadron staff
  and Tenants already use for identity).

**Sequencing:** SSO is decoupled from Customers. Ship **Phase 2a (Customer
bridge)** first — it needs no auth changes — and run **Shared SSO as its own
phase** alongside the ERP work, starting with the IdP decision above.

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

## 7. Decisions
1. **Transport** — ERP pushes to the App `erp-ingest` function. *(default, confirm)*
2. **Users/auth** — **Shared SSO** (see §4). Resolved; runs as its own phase.
3. **IdP / issuer for SSO** — OPEN. Which identity authority both projects trust
   (driven by what Hadron + Tenants already use).
4. **Linking UX** — OPEN. Who sets `erp_tenant_id` on an App org, and where.
