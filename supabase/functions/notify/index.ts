/*
 * Hadron Group — `notify` Edge Function
 *
 * Sends a Web Push notification to one or more users. Only trusted server-side callers may use it (a database trigger
 * via pg_net, a cron job, a smoke test from a terminal): the app never calls it.
 *
 * Who may call (v6, 2026-10-04): a request with the shared secret in `x-hadron-key` (when HADRON_NOTIFY_KEY is set),
 * or one signed with the project's service-role key. Everyone else gets 403. The function runs with the service role
 * and takes user_id / org_id from the body, so before v6 the app's public anon key (which passes the JWT check) let
 * anyone push any title, text and link to any user or company; v5 checked the shared secret only when it was set.
 *
 * Deploy (keep verify_jwt on: the role check below relies on the platform having verified the JWT):
 *   supabase functions deploy notify
 *
 * Required secrets (set with `supabase secrets set`):
 *   VAPID_PUBLIC_KEY    Same value you put in push.js
 *   VAPID_PRIVATE_KEY   The private key from `npx web-push generate-vapid-keys`
 *   VAPID_SUBJECT       e.g. "mailto:apps@hadrongrp.com" (optional)
 *   HADRON_NOTIFY_KEY   Optional: a shared secret for callers that don't use the service-role key
 *
 * Invocation:
 *   POST /functions/v1/notify
 *   Authorization: Bearer <service-role JWT>        (or another valid JWT together with x-hadron-key)
 *   x-hadron-key: <HADRON_NOTIFY_KEY>                (optional with the service-role key)
 *   {
 *     "user_id":   "<profiles.id>",                 // OR
 *     "org_id":    "<organisations.id>",            // fan-out to every member of an org
 *     "role":      "customer_admin",                // optional filter when using org_id
 *     "title":     "New lab report ready",
 *     "body":      "Sample SAM-1042 has been authorised.",
 *     "link":      "#lims/sample/SAM-1042",         // an app link: "#route", "./path", "/path" or
 *                                                   // https://app.hadrongrp.com/…; anything else opens the app's home
 *     "tag":       "sample-1042"                    // optional, dedups in OS notification tray
 *   }
 *
 * Response: { delivered: number, failed: number, removed_endpoints: number }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC     = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE    = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT    = Deno.env.get('VAPID_SUBJECT') || 'mailto:apps@hadrongrp.com';
const NOTIFY_KEY       = Deno.env.get('HADRON_NOTIFY_KEY') || '';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

interface NotifyBody {
  user_id?: string;
  org_id?: string;
  role?: string;
  title: string;
  body?: string;
  link?: string;
  tag?: string;
}

// Compares in time that doesn't depend on where the strings first differ.
function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// The caller's role from its JWT. With verify_jwt on, the platform has checked the signature before this runs, so the
// claims can be read as they are.
function jwtRole(req: Request): string {
  const m = (req.headers.get('authorization') || '').match(/^Bearer\s+([^.\s]+)\.([^.\s]+)\.[^.\s]+$/i);
  if (!m) return '';
  try {
    const b64 = m[2].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)));
    return typeof claims.role === 'string' ? claims.role : '';
  } catch { return ''; }
}

// A link into the app only, never to another site.
const APP_LINK = /^(#|\.\/|\/(?!\/)|https:\/\/app\.hadrongrp\.com\/)/;

async function getTargetUserIds(req: NotifyBody): Promise<string[]> {
  if (req.user_id) return [req.user_id];
  if (req.org_id) {
    let q = supabase.from('profiles').select('id').eq('organisation_id', req.org_id);
    if (req.role) q = q.eq('role', req.role);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(p => p.id);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Trusted callers only: the shared key, or the service-role key. The public anon key and signed-in users are refused.
  const keyOk = !!NOTIFY_KEY && sameSecret(req.headers.get('x-hadron-key') || '', NOTIFY_KEY);
  if (!keyOk && jwtRole(req) !== 'service_role') return new Response('Forbidden', { status: 403 });

  let body: NotifyBody;
  try { body = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  if (!body.title) return new Response('title is required', { status: 400 });

  const userIds = await getTargetUserIds(body);
  if (!userIds.length) return Response.json({ delivered: 0, failed: 0, removed_endpoints: 0 });

  const { data: subs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_secret')
    .in('user_id', userIds);
  if (subErr) return new Response(subErr.message, { status: 500 });

  const payload = JSON.stringify({
    title: body.title,
    body:  body.body  || '',
    link:  typeof body.link === 'string' && APP_LINK.test(body.link) ? body.link : './',
    tag:   body.tag   || ''
  });

  let delivered = 0, failed = 0, removed = 0;
  const deadEndpoints: string[] = [];

  await Promise.all((subs || []).map(async (sub) => {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_secret }
      }, payload);
      delivered++;
    } catch (err: any) {
      // 404/410 from the push service means the subscription is dead — clean it up.
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(sub.id);
        removed++;
      } else {
        console.error('[notify] push failed', sub.endpoint, err.statusCode || err.message);
        failed++;
      }
    }
  }));

  if (deadEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('id', deadEndpoints);
  }

  return Response.json({ delivered, failed, removed_endpoints: removed });
});
