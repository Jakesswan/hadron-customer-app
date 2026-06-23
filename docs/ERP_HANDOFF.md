# ERP → App bridge — handoff brief for the Hadron-ERP session

**Purpose:** everything the **Hadron-ERP** codebase needs to build its half of the
one-way ERP→App bridge and Shared SSO. The App half (this repo,
`hadron-customer-app`) is already built. Paste this whole file into the ERP
session as context.

> This brief is written from the App side. It does not assume the ERP session
> knows anything about the App. Nothing here changes ERP business logic — it
> adds an outbound push + an identity-trust setup.

---

## 0. The shape of it (read first)

- **Two separate Supabase projects.** ERP has its own; the App is project
  `flttrqcstzprtxcdvexx`. They are NOT merged. They connect only through a
  **narrow, one-way push: ERP → App**, for **Customers** (now) and **Users**
  (via SSO, later). Nothing flows App → ERP in this phase.
- **Terminology (locked):** **Tenant** = a customer of Hadron (uses ERP and/or
  App; in the ERP = a `tenants` row; in the App = an `organisations` row).
  **Customer** = a customer of a Tenant (ERP `customers` row → App `customers` row).
- **The ERP is the source of truth** for Customer + User master data of any
  Tenant that is *linked*. The App makes those records read-only.

## 1. Identity mapping

| Concept | ERP | App |
|---|---|---|
| Tenant | `tenants.id` (uuid) | `organisations.erp_tenant_id` (uuid) |
| Customer | `customers.id` (uuid) | `customers.external_id` (text), `id = 'erp-'+external_id` |
| User | auth user / profile (uuid) | `profiles.external_id` (SSO phase) |

A Tenant is "linked" when the App `organisations` row carries
`erp_tenant_id = <that ERP tenant's id>`. **The App org must exist and carry
that value before any customer push** — the App rejects pushes for unknown
tenants and never auto-creates orgs.

## 2. What the App already provides (rely on these)

- App DB columns (migration 0002, additive): `organisations.erp_tenant_id`,
  `organisations.erp_linked_at`; `customers.source` (`'app'|'erp'`),
  `customers.external_id`.
- **Ingest endpoint** (deployed by Hadron on the App project):
  `POST https://flttrqcstzprtxcdvexx.supabase.co/functions/v1/erp-ingest`
- When a customer arrives, it surfaces in the App's LIMS automatically (the App
  already syncs `customers` → its local client list in realtime). The App shows
  ERP customers read-only.

## 3. ERP task A — Tenant linking

Decide which ERP tenant maps to which App organisation and write
`erp_tenant_id` onto the App org.

- **v1 (manual, fine to start):** when onboarding a linked Tenant, a Hadron admin
  runs this once in the **App** project's SQL editor (service role):
  ```sql
  update public.organisations
     set erp_tenant_id = '<ERP tenants.id>', erp_linked_at = now()
   where id = '<App organisations.id>';
  ```
  (If the App org doesn't exist yet, create it first — that's the App's
  onboarding flow.)
- **v2 (automate later):** add an App-side `provision-linked-org` function the
  ERP calls to create + link the org in one step. Not needed for the first
  linked Tenant.

## 4. ERP task B — Customer push (Phase 2a)

On every create/update/delete of a `customers` row **belonging to a linked
Tenant**, POST it to the App ingest endpoint.

**Request the ERP must send:**
```
POST https://flttrqcstzprtxcdvexx.supabase.co/functions/v1/erp-ingest
Headers:
  Authorization: Bearer <APP_ANON_KEY>          # passes the Supabase gateway (public key, below)
  X-Bridge-Secret: <BRIDGE_SHARED_SECRET>        # the real auth — shared secret
  Content-Type: application/json
Body:
{
  "erp_tenant_id": "<tenants.id of the customer's tenant>",
  "customers": [
    {
      "external_id":   "<customers.id>",
      "name":          "<customers.name>",
      "contact_name":  "<customers.contact_name>",
      "contact_email": "<customers.email>",
      "contact_phone": "<customers.phone>",
      "address":       "<compose from bill_street/city/region/postal/country>",
      "notes":         null,
      "deleted":       false               // true when the ERP soft/hard-deletes
    }
  ]
}
```
Response: `{ org_id, upserted, deleted, skipped, errors }`. Idempotent — safe to
resend. Batch many customers per call (the `customers` array).

**Recommended mechanism:** a **Supabase Database Webhook** on the ERP `customers`
table → a small ERP **edge function** (`push-customer-to-app`) that maps the row
to the payload above and POSTs it. Why: decoupled, retryable, secrets stay
server-side. *Quick alternative:* a Postgres trigger using `pg_net.http_post`
directly — fewer moving parts, harder to observe/retry.

**Only push linked Tenants.** If `tenants` has no App link, skip (the App would
404 anyway). A first full backfill = page through a linked Tenant's customers
and POST them in batches.

## 5. ERP task C — Shared SSO (Users phase)

**Goal:** one identity logs into both ERP and App. Because the two are separate
Supabase projects (neither can natively trust the other's JWTs), this needs **one
OIDC issuer both projects trust**, with the **ERP as the identity authority**.

**FIRST DECISION (blocks this phase): which issuer / IdP?** Driven by what Hadron
staff and Tenants already sign in with. Options:
- Microsoft Entra ID / Google Workspace (if already in use) — least new infra.
- A dedicated IdP (Auth0 / WorkOS / Keycloak) the ERP federates to.

**Then:**
1. Stand up / choose the OIDC issuer; ERP auth federates to it.
2. In the **App** Supabase project, configure *Third-Party Auth* to trust that
   issuer.
3. The bridge stamps `profiles.external_id` = the user's stable `sub`, so a
   bridged user is matched to their App profile on first SSO login.
4. **Standalone App-only Tenants keep the App's own email/Google auth** — SSO
   applies only to linked Tenants.

This is mostly dashboard + IdP configuration across both projects, plus the ERP
including users in its push. Treat it as its own phase after Customers works.

## 6. Sequencing & checklist

- [ ] **A.** Link the test Tenant (set `erp_tenant_id` on its App org).
- [ ] **B.** Deploy the App `erp-ingest` function + set `BRIDGE_SHARED_SECRET`
      (App project). *(Hadron does this on the App side.)*
- [ ] **B.** Build the ERP `push-customer-to-app` webhook/function; push one
      customer; confirm `upserted:1`.
- [ ] **B.** Open the App as that Tenant → customer appears, Clients read-only.
- [ ] **B.** Backfill the Tenant's existing customers.
- [ ] **C.** Decide the SSO issuer → configure both projects → bridge users.

## 7. Config / secrets reference

| Name | Value | Where |
|---|---|---|
| App project ref | `flttrqcstzprtxcdvexx` | — |
| App ingest URL | `https://flttrqcstzprtxcdvexx.supabase.co/functions/v1/erp-ingest` | ERP push target |
| `APP_ANON_KEY` | `sb_publishable_7_PDTLJxHx7tXxDbDeI6ow_DnEvoJGC` | public; ERP sends as `Authorization: Bearer` |
| `BRIDGE_SHARED_SECRET` | *(generate a long random string)* | set on BOTH: App function secret + ERP secret store |

> The anon key is public by design (the App ships it in the browser). The real
> gate is `BRIDGE_SHARED_SECRET` — keep that one secret, server-side only.
