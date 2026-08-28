/*
 * Hadron Group — `erp-ingest` Edge Function  (Phase 2a, ERP → App bridge)
 *
 * Receives Customer master data PUSHED one-way from the ERP and upserts it into
 * the App database for the matching linked Tenant. The ERP is the source of
 * truth; the App never pushes back here and never creates organisations from a
 * push — an unknown / unlinked tenant is rejected.
 *
 * Deploy:
 *   supabase functions deploy erp-ingest
 *
 * Required secret:
 *   BRIDGE_SHARED_SECRET   long random string; the ERP must send it as the
 *                          X-Bridge-Secret header. This is the real auth gate.
 *   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
 *
 * Gateway note: Supabase's function gateway still expects a valid JWT, so the
 * ERP must ALSO send `Authorization: Bearer <APP_ANON_KEY>` (the anon key is
 * enough to pass the gateway). Real authorisation is the shared secret below.
 *
 * Request:
 *   POST /functions/v1/erp-ingest
 *   Authorization: Bearer <APP anon key>
 *   X-Bridge-Secret: <BRIDGE_SHARED_SECRET>
 *   {
 *     "erp_tenant_id": "<erp tenants.id uuid>",
 *     "customers": [
 *       { "external_id": "<erp customers.id>", "name": "Acme (Pty) Ltd",
 *         "contact_name": "...", "contact_email": "...", "contact_phone": "...",
 *         "address": "...", "notes": "...", "payload": { ... },
 *         "deleted": false }
 *     ]
 *   }
 *
 * Response: { org_id, upserted, deleted, skipped, errors: string[] }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BRIDGE_SECRET    = Deno.env.get('BRIDGE_SHARED_SECRET') || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

interface IncomingCustomer {
  external_id: string;
  name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  notes?: string;
  payload?: Record<string, unknown>;
  deleted?: boolean;
}

interface IncomingUser {
  email: string;
  full_name?: string;
  role?: string;            // App role: admin | customer_admin | operator | viewer
  deleted?: boolean;
}

interface IngestBody {
  erp_tenant_id?: string;
  customers?: IncomingCustomer[];
  users?: IncomingUser[];
}

// Constant-time string compare (length is allowed to leak).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // ── Auth: shared secret ──────────────────────────────────
  if (!BRIDGE_SECRET) {
    console.error('[erp-ingest] BRIDGE_SHARED_SECRET is not set');
    return new Response('Bridge not configured', { status: 503 });
  }
  const presented = req.headers.get('x-bridge-secret') || '';
  if (!safeEqual(presented, BRIDGE_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ── Parse + validate ─────────────────────────────────────
  let body: IngestBody;
  try { body = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  if (!body.erp_tenant_id) return new Response('erp_tenant_id is required', { status: 400 });
  if (!Array.isArray(body.customers) && !Array.isArray(body.users)) {
    return new Response('customers[] or users[] is required', { status: 400 });
  }

  // ── Resolve the linked organisation (never auto-create) ──
  const { data: org, error: orgErr } = await supabase
    .from('organisations')
    .select('id')
    .eq('erp_tenant_id', body.erp_tenant_id)
    .maybeSingle();
  if (orgErr) return new Response(orgErr.message, { status: 500 });
  if (!org) {
    return Response.json(
      { error: 'No App organisation is linked to this erp_tenant_id' },
      { status: 404 }
    );
  }

  // ── Split into upserts and deletes ───────────────────────
  const errors: string[] = [];
  const upsertRows: Record<string, unknown>[] = [];
  const deleteIds: string[] = [];
  let skipped = 0;

  for (const c of (body.customers ?? [])) {
    if (!c || typeof c.external_id !== 'string' || !c.external_id) {
      skipped++; errors.push('customer missing external_id'); continue;
    }
    const id = `erp-${c.external_id}`;
    if (c.deleted) { deleteIds.push(id); continue; }
    if (!c.name) { skipped++; errors.push(`customer ${c.external_id} missing name`); continue; }
    upsertRows.push({
      id,
      organisation_id: org.id,
      source: 'erp',
      external_id: c.external_id,
      name: c.name,
      contact_name:  c.contact_name  ?? null,
      contact_email: c.contact_email ?? null,
      contact_phone: c.contact_phone ?? null,
      address:       c.address       ?? null,
      notes:         c.notes         ?? null,
      payload:       c.payload       ?? null,
      updated_at:    new Date().toISOString()
    });
  }

  // ── Apply ────────────────────────────────────────────────
  let upserted = 0, deleted = 0;

  if (upsertRows.length) {
    const { error } = await supabase
      .from('customers')
      .upsert(upsertRows, { onConflict: 'id' });
    if (error) errors.push(`upsert failed: ${error.message}`);
    else upserted = upsertRows.length;
  }

  if (deleteIds.length) {
    // Scope the delete to this org and to ERP-sourced rows only, so a stray
    // id can never remove an App-created customer or another Tenant's data.
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('organisation_id', org.id)
      .eq('source', 'erp')
      .in('id', deleteIds);
    if (error) errors.push(`delete failed: ${error.message}`);
    else deleted = deleteIds.length;
  }

  // ── Users → erp_user_directory (email-based tenant linking) ──
  // A pushed user's email, mapped to THIS org + role, so that when they sign up
  // on the App with the same email they land in this tenant (handle_new_user).
  let usersUpserted = 0, usersDeleted = 0;
  const userUpserts: Record<string, unknown>[] = [];
  const userDeleteEmails: string[] = [];
  const ALLOWED_ROLES = new Set(['admin', 'customer_admin', 'operator', 'viewer']);

  for (const u of (body.users ?? [])) {
    if (!u || typeof u.email !== 'string' || !u.email.trim()) {
      skipped++; errors.push('user missing email'); continue;
    }
    const email = u.email.trim().toLowerCase();
    if (u.deleted) { userDeleteEmails.push(email); continue; }
    userUpserts.push({
      email,
      organisation_id: org.id,
      role: (u.role && ALLOWED_ROLES.has(u.role)) ? u.role : 'operator',
      erp_tenant_id: body.erp_tenant_id,
      updated_at: new Date().toISOString()
    });
  }

  if (userUpserts.length) {
    const { error } = await supabase
      .from('erp_user_directory')
      .upsert(userUpserts, { onConflict: 'email' });
    if (error) errors.push(`user upsert failed: ${error.message}`);
    else usersUpserted = userUpserts.length;
  }

  if (userDeleteEmails.length) {
    // Scope to THIS org so a stray email can never unlink another tenant's user.
    const { error } = await supabase
      .from('erp_user_directory')
      .delete()
      .eq('organisation_id', org.id)
      .in('email', userDeleteEmails);
    if (error) errors.push(`user delete failed: ${error.message}`);
    else usersDeleted = userDeleteEmails.length;
  }

  return Response.json({
    org_id: org.id,
    upserted, deleted,
    users_upserted: usersUpserted, users_deleted: usersDeleted,
    skipped, errors
  });
});
